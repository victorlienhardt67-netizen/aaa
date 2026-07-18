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
}): Promise<Record<string, unknown>> {
  const messages = [
    ...(params.history ?? []),
    { role: "user" as const, content: buildUserContent(params.userMessage, params.images) },
  ];

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
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

  const data = await res.json();
  const toolUseBlock = (data.content as Array<{ type: string; input?: Record<string, unknown> }>)?.find(
    (b) => b.type === "tool_use"
  );
  if (!toolUseBlock?.input) {
    throw new Error("Claude n'a pas retourné de résultat structuré (tool_use manquant)");
  }
  return toolUseBlock.input;
}
