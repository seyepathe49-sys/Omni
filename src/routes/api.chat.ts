import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  message: z.string().trim().min(1).max(12000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(12000),
  })).max(12).optional().default([]),
});

type ToolCall = { type?: string; name?: string; arguments?: string; call_id?: string };
type ResponsePayload = {
  id?: string;
  error?: { message?: string };
  output_text?: string;
  output?: { type?: string; name?: string; arguments?: string; call_id?: string; content?: { type?: string; text?: string }[] }[];
};

const githubTools = [
  {
    type: "function",
    name: "github_read_file",
    description: "Leggi i metadati di un repository GitHub e il contenuto testuale di un file. Usa questo strumento prima di modificare un file esistente per ottenere il suo SHA.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        repository: { type: "string", description: "Repository nel formato owner/nome" },
        path: { type: "string", description: "Percorso del file nel repository; usa . per la root solo se l'API lo supporta" },
        ref: { type: ["string", "null"], description: "Branch, tag o commit; null per il branch predefinito" },
      },
      required: ["repository", "path", "ref"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "github_write_file",
    description: "Crea o aggiorna un file testuale su GitHub. Per aggiornare un file esistente, prima leggi il file con github_read_file e passa lo SHA restituito. Lascia sha vuoto solo per creare un nuovo file.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        repository: { type: "string", description: "Repository nel formato owner/nome" },
        path: { type: "string", description: "Percorso del file nel repository" },
        content: { type: "string", description: "Contenuto completo del file" },
        message: { type: "string", description: "Messaggio del commit" },
        sha: { type: "string", description: "SHA attuale del file, oppure stringa vuota per un nuovo file" },
        branch: { type: ["string", "null"], description: "Branch da aggiornare, oppure null per il branch predefinito" },
      },
      required: ["repository", "path", "content", "message", "sha", "branch"],
      additionalProperties: false,
    },
  },
] as const;

async function runGitHubTool(name: string, rawArgs: string, token: string) {
  let args: Record<string, unknown>;
  try { args = JSON.parse(rawArgs) as Record<string, unknown>; }
  catch { return { error: "Argomenti dello strumento non validi." }; }

  const repository = typeof args.repository === "string" ? args.repository : "";
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) return { error: "Repository non valido: usa owner/nome." };
  const path = typeof args.path === "string" ? args.path.replace(/^\/+/, "") : "";
  const branch = typeof args.branch === "string" ? args.branch : undefined;

  if (name === "github_read_file") {
    const ref = typeof args.ref === "string" ? args.ref : undefined;
    const suffix = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path.split("/").map(encodeURIComponent).join("/")}${suffix}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    });
    const data = await response.json() as { message?: string; name?: string; path?: string; sha?: string; type?: string; encoding?: string; content?: string; html_url?: string; default_branch?: string };
    if (!response.ok) return { error: data.message ?? `GitHub ha risposto con HTTP ${response.status}.` };
    if (data.type !== "file" || !data.content) return { error: "Il percorso non è un singolo file testuale. Specifica il percorso di un file." };
    return {
      repository, path: data.path, sha: data.sha, url: data.html_url,
      content: Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8"),
    };
  }

  if (name === "github_write_file") {
    const content = typeof args.content === "string" ? args.content : "";
    const message = typeof args.message === "string" ? args.message : "Update file via Omni";
    const sha = typeof args.sha === "string" ? args.sha : "";
    const body: Record<string, unknown> = { message, content: Buffer.from(content, "utf8").toString("base64") };
    if (sha) body.sha = sha;
    if (branch) body.branch = branch;
    const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify(body),
    });
    const data = await response.json() as { message?: string; content?: { path?: string; html_url?: string; sha?: string }; commit?: { sha?: string; html_url?: string } };
    if (!response.ok) return { error: data.message ?? `GitHub ha risposto con HTTP ${response.status}.` };
    return { success: true, path: data.content?.path, fileUrl: data.content?.html_url, commitSha: data.commit?.sha, commitUrl: data.commit?.html_url };
  }
  return { error: "Strumento GitHub sconosciuto." };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const origin = request.headers.get("origin");
          const parsedOrigin = origin ? new URL(origin) : null;
          const requestUrl = new URL(request.url);
          const requestHost = (request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || requestUrl.host).toLowerCase();
          const requestProtocol = (request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || requestUrl.protocol.replace(":", "")).toLowerCase();
          if (!parsedOrigin || !["http:", "https:"].includes(parsedOrigin.protocol) || parsedOrigin.host.toLowerCase() !== requestHost || parsedOrigin.protocol !== `${requestProtocol}:`) {
            return Response.json({ error: "Origine della richiesta non valida. Ricarica Omni e riprova." }, { status: 403 });
          }
        } catch {
          return Response.json({ error: "Richiesta non valida." }, { status: 400 });
        }

        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Messaggio non valido o troppo lungo." }, { status: 400 });

        const apiKey = typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined;
        if (!apiKey) return Response.json({ error: "OpenAI non è configurato sul server. Aggiungi OPENAI_API_KEY nelle variabili d'ambiente." }, { status: 503 });

        const githubToken = typeof process !== "undefined" ? process.env.GITHUB_TOKEN : undefined;
        const { message, history } = parsed.data;
        const conversation = [
          ...history.map((item) => ({ role: item.role, content: item.content })),
          { role: "user", content: message },
        ];

        const instructions = [
          "Sei Omni, un assistente generale capace di ragionare, cercare informazioni e aiutare con progetti software. Rispondi nella lingua dell'utente, normalmente in italiano.",
          "Usa web_search per informazioni aggiornate, siti specifici, notizie e per verificare fonti. Non dire genericamente che non puoi visitare siti web: usa la ricerca quando è utile.",
          githubToken
            ? "Hai strumenti GitHub per leggere e scrivere file nei repository a cui il token configurato ha accesso. Prima di modificare un file esistente, leggilo e usa lo SHA restituito. Dopo ogni modifica, riferisci il commit e il file realmente modificati. Non dichiarare di aver eseguito build o test se non li hai eseguiti."
            : "La ricerca web è disponibile. Per GitHub il server non ha GITHUB_TOKEN configurato, quindi puoi leggere fonti pubbliche con la ricerca web ma non modificare direttamente repository. Non fingere di aver scritto file o fatto commit.",
          "Non affermare di aver aperto, modificato, eseguito o testato file, repository o build se non hai davvero eseguito quell'azione tramite uno strumento.",
          "Quando l'utente chiede di rifare un sito esistente, cerca il sito e analizzane le pagine accessibili prima di proporre una soluzione. Distingui chiaramente analisi, modifiche realmente applicate e verifiche non eseguite.",
          "Sii concreto e diretto. Se manca un'autorizzazione o una configurazione, spiega esattamente quale serve."
        ].join(" ");

        try {
          let response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
              instructions,
              tools: [
                { type: "web_search" },
                ...(githubToken ? [...githubTools] : []),
              ],
              input: conversation,
              max_output_tokens: 6000,
            }),
          });

          let data = await response.json() as ResponsePayload;
          if (!response.ok) return Response.json({ error: data.error?.message ?? `OpenAI ha risposto con HTTP ${response.status}.` }, { status: 502 });

          // Process tool calls with a strict upper bound to avoid runaway loops.
          for (let turn = 0; turn < 5; turn++) {
            const calls = (data.output ?? []).filter((item) => item.type === "function_call") as ToolCall[];
            if (!calls.length) break;
            const outputs: { type: "function_call_output"; call_id: string; output: string }[] = [];
            for (const call of calls) {
              if (!call.call_id || !call.name || !call.arguments) continue;
              let result: unknown;
              if (call.name === "github_read_file" || call.name === "github_write_file") {
                result = githubToken
                  ? await runGitHubTool(call.name, call.arguments, githubToken)
                  : { error: "GITHUB_TOKEN non configurato." };
              } else {
                result = { error: "Strumento non disponibile." };
              }
              outputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
            }
            if (!outputs.length) break;
            response = await fetch("https://api.openai.com/v1/responses", {
              method: "POST",
              headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
                instructions,
                tools: [{ type: "web_search" }, ...(githubToken ? [...githubTools] : [])],
                previous_response_id: data.id,
                input: outputs,
                max_output_tokens: 6000,
              }),
            });
            data = await response.json() as ResponsePayload;
            if (!response.ok) return Response.json({ error: data.error?.message ?? `OpenAI ha risposto con HTTP ${response.status}.` }, { status: 502 });
          }

          const answer = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text" || part.type === "text").map((part) => part.text ?? "").join("");
          if (!answer?.trim()) return Response.json({ error: "Il modello non ha restituito una risposta. Riprova." }, { status: 502 });
          return Response.json({ answer });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Errore di connessione al servizio AI.";
          return Response.json({ error: message.slice(0, 500) }, { status: 502 });
        }
      },
    },
  },
});
