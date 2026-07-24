// Client serveur pour l'API Claude — utilisé uniquement dans les routes API Next.js
// (jamais côté navigateur), pour éviter d'exposer les appels CORS directs.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
// Ajuster ici si un nouveau modèle Claude doit être utilisé.
const CLAUDE_MODEL = "claude-sonnet-5";

interface ClaudeTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** data:image/png;base64,xxxx → { mediaType, data } */
function parseDataUri(dataUri: string): { mediaType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

function buildUserContent(userMessage: string, images?: string[]): string | ContentBlock[] {
  if (!images || images.length === 0) return userMessage;
  const blocks: ContentBlock[] = [];
  for (const img of images) {
    const parsed = parseDataUri(img);
    if (parsed) {
      blocks.push({ type: "image", source: { type: "base64", media_type: parsed.mediaType, data: parsed.data } });
    }
  }
  blocks.push({ type: "text", text: userMessage });
  return blocks;
}

export async function callClaudeTool(params: {
  apiKey: string;
  system: string;
  userMessage: string;
  tool: ClaudeTool;
  /** Images en data URI (data:image/...;base64,...) — pour l'analyse visuelle (vision). */
  images?: string[];
  /**
   * Tours précédents d'une conversation multi-tours (ex: co-construction du
   * brief) — texte brut uniquement, jamais les blocs tool_use bruts d'un appel
   * précédent : le tool_choice forcé ne s'applique qu'au dernier tour généré,
   * les tours antérieurs peuvent rester du texte simple.
   */
  history?: { role: "user" | "assistant"; content: string }[];
  /**
   * Budget de sortie — à augmenter pour les réponses volumineuses (ex: plan
   * de production avec beaucoup de scènes), sinon Claude est coupé en plein
   * milieu du JSON sans erreur explicite. Le streaming est utilisé au-delà de
   * 8192 pour éviter un timeout HTTP côté plateforme d'hébergement.
   */
  maxTokens?: number;
}): Promise<Record<string, unknown>> {
  const messages = [
    ...(params.history ?? []),
    { role: "user" as const, content: buildUserContent(params.userMessage, params.images) },
  ];
  const maxTokens = params.maxTokens ?? 8192;
  const useStreaming = maxTokens > 8192;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      stream: useStreaming,
      system: params.system,
      messages,
      tools: [params.tool],
      tool_choice: { type: "tool", name: params.tool.name },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${text.slice(0, 500)}`);
  }

  const { content, stopReason } = useStreaming
    ? await consumeStream(res)
    : await consumeJson(res);

  if (stopReason === "max_tokens") {
    throw new Error(
      "La réponse de Claude a été coupée avant la fin (limite de tokens atteinte) — réessaie avec un script plus court ou une durée cible plus faible."
    );
  }

  const toolUseBlock = content.find((b) => b.type === "tool_use");
  if (!toolUseBlock?.input) {
    throw new Error("Claude n'a pas retourné de résultat structuré (tool_use manquant)");
  }
  return toolUseBlock.input;
}

type ParsedContentBlock = { type: string; input?: Record<string, unknown> };

async function consumeJson(res: Response): Promise<{ content: ParsedContentBlock[]; stopReason?: string }> {
  const data = await res.json();
  return { content: (data.content as ParsedContentBlock[]) ?? [], stopReason: data.stop_reason };
}

/**
 * Reconstitue la réponse à partir du flux SSE — nécessaire pour les gros
 * max_tokens (>8192) car l'API Anthropic rejette ces requêtes en mode non
 * streamé (timeout HTTP probable côté client/plateforme sur une génération
 * longue) et exige explicitement le streaming au-delà de ce seuil.
 */
async function consumeStream(res: Response): Promise<{ content: ParsedContentBlock[]; stopReason?: string }> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Réponse Claude vide (streaming).");
  const decoder = new TextDecoder();
  const blocks: ParsedContentBlock[] = [];
  const jsonBuffers: string[] = [];
  let stopReason: string | undefined;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const event = JSON.parse(line.slice(6));
      if (event.type === "content_block_start") {
        blocks[event.index] = event.content_block;
        jsonBuffers[event.index] = "";
      } else if (event.type === "content_block_delta" && event.delta?.type === "input_json_delta") {
        jsonBuffers[event.index] = (jsonBuffers[event.index] ?? "") + event.delta.partial_json;
      } else if (event.type === "message_delta") {
        stopReason = event.delta?.stop_reason ?? stopReason;
      }
    }
  }

  blocks.forEach((block, i) => {
    if (block?.type === "tool_use" && jsonBuffers[i]) {
      try {
        block.input = JSON.parse(jsonBuffers[i]);
      } catch {
        // JSON incomplet (coupé par max_tokens) — laissé sans input, détecté via stopReason plus haut.
      }
    }
  });

  return { content: blocks, stopReason };
}
