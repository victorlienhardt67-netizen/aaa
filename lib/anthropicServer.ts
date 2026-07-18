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

export async function callClaudeTool(params: {
  apiKey: string;
  system: string;
  userMessage: string;
  tool: ClaudeTool;
}): Promise<Record<string, unknown>> {
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
      messages: [{ role: "user", content: params.userMessage }],
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
