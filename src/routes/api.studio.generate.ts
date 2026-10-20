import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().trim().min(3).max(12000),
  provider: z.enum(["openai", "anthropic", "gemini"]),
  model: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._:-]+$/),
  currentHtml: z.string().max(300000).optional().default(""),
});

type Provider = z.infer<typeof requestSchema>["provider"];

// Best-effort per-instance protection. Configure platform-level rate limiting and authentication before public production use.
const requestWindows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;

function htmlOnly(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.toLowerCase().indexOf("<!doctype");
  const htmlStart = candidate.toLowerCase().indexOf("<html");
  const index = start >= 0 ? start : htmlStart;
  const result = index >= 0 ? candidate.slice(index) : candidate;
  if (!/<html[\s>]/i.test(result) || !/<\/html\s*>/i.test(result)) {
    throw new Error("Il modello non ha restituito un documento HTML completo. Riprova con una richiesta più specifica.");
  }
  return result;
}

async function generateWithOpenAI(apiKey: string, model: string, prompt: string, currentHtml: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are OmniStudio, an expert web product builder. Return ONLY a complete, self-contained HTML document with inline CSS and JavaScript. No markdown fences or explanations. Make it polished, responsive, accessible, and functional. Never include secrets or attempt to escape the iframe sandbox. Use only front-end browser capabilities; explain via visible UI if a backend is needed." },
        { role: "user", content: currentHtml ? `Update this existing project according to the request. Preserve useful features and return the entire updated HTML document.\n\nREQUEST:\n${prompt}\n\nCURRENT HTML:\n${currentHtml}` : `Create a complete polished responsive website as a single HTML file.\n\nREQUEST:\n${prompt}` },
      ],
    }),
  });
  const data = await response.json() as { error?: { message?: string }; choices?: { message?: { content?: string } }[] };
  if (!response.ok) throw new Error(data.error?.message ?? `OpenAI ha risposto con HTTP ${response.status}.`);
  const result = data.choices?.[0]?.message?.content;
  if (!result) throw new Error("Il modello OpenAI ha restituito una risposta vuota.");
  return result;
}

async function generateWithAnthropic(apiKey: string, model: string, prompt: string, currentHtml: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 12000,
      system: "You are OmniStudio, an expert web product builder. Return ONLY a complete, self-contained HTML document with inline CSS and JavaScript. No markdown fences or explanations. Make it polished, responsive, accessible, and functional. Never include secrets or attempt to escape the iframe sandbox. Use only front-end browser capabilities; explain via visible UI if a backend is needed.",
      messages: [{ role: "user", content: currentHtml ? `Update this existing project according to the request. Preserve useful features and return the entire updated HTML document.\n\nREQUEST:\n${prompt}\n\nCURRENT HTML:\n${currentHtml}` : `Create a complete polished responsive website as a single HTML file.\n\nREQUEST:\n${prompt}` }],
    }),
  });
  const data = await response.json() as { error?: { message?: string }; content?: { type: string; text?: string }[] };
  if (!response.ok) throw new Error(data.error?.message ?? `Anthropic ha risposto con HTTP ${response.status}.`);
  const result = data.content?.find((item) => item.type === "text")?.text;
  if (!result) throw new Error("Il modello Anthropic ha restituito una risposta vuota.");
  return result;
}

async function generateWithGemini(apiKey: string, model: string, prompt: string, currentHtml: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: "You are OmniStudio, an expert web product builder. Return ONLY a complete, self-contained HTML document with inline CSS and JavaScript. No markdown fences or explanations. Make it polished, responsive, accessible, and functional. Never include secrets or attempt to escape the iframe sandbox. Use only front-end browser capabilities; explain via visible UI if a backend is needed." }] },
      contents: [{ role: "user", parts: [{ text: currentHtml ? `Update this existing project according to the request. Preserve useful features and return the entire updated HTML document.\n\nREQUEST:\n${prompt}\n\nCURRENT HTML:\n${currentHtml}` : `Create a complete polished responsive website as a single HTML file.\n\nREQUEST:\n${prompt}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 12000 },
    }),
  });
  const data = await response.json() as { error?: { message?: string }; candidates?: { content?: { parts?: { text?: string }[] } }[] };
  if (!response.ok) throw new Error(data.error?.message ?? `Gemini ha risposto con HTTP ${response.status}.`);
  const result = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!result) throw new Error("Il modello Gemini ha restituito una risposta vuota.");
  return result;
}

export const Route = createFileRoute("/api/studio/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        let requestOrigin = "";
        try { requestOrigin = new URL(request.url).origin; } catch { /* Invalid request URL. */ }
        if (!origin || origin !== requestOrigin) {
          return Response.json({ error: "Origine della richiesta non valida. Ricarica OmniStudio e riprova." }, { status: 403 });
        }
        const clientId = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const now = Date.now();
        const currentWindow = requestWindows.get(clientId);
        if (!currentWindow || currentWindow.resetAt <= now) {
          requestWindows.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
        } else if (currentWindow.count >= MAX_REQUESTS_PER_WINDOW) {
          return Response.json({ error: "Hai raggiunto il limite temporaneo di generazioni. Attendi qualche minuto e riprova." }, { status: 429 });
        } else {
          currentWindow.count += 1;
        }
        try {
          const parsed = requestSchema.safeParse(await request.json());
          if (!parsed.success) {
            return Response.json({ error: "Richiesta non valida. Controlla prompt, modello e dimensione del progetto." }, { status: 400 });
          }
          const { prompt, provider, model, currentHtml } = parsed.data;
          const env = typeof process !== "undefined" ? process.env as Record<string, string | undefined> : {};
          const keys: Record<Provider, string | undefined> = {
            openai: env.OPENAI_API_KEY,
            anthropic: env.ANTHROPIC_API_KEY,
            gemini: env.GEMINI_API_KEY,
          };
          const apiKey = keys[provider];
          if (!apiKey) {
            const variable = provider === "openai" ? "OPENAI_API_KEY" : provider === "anthropic" ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY";
            return Response.json({ error: `Provider non configurato. Aggiungi ${variable} tra i segreti del backend e riprova. La chiave non va inserita nel frontend.` }, { status: 503 });
          }
          const raw = provider === "openai"
            ? await generateWithOpenAI(apiKey, model, prompt, currentHtml)
            : provider === "anthropic"
              ? await generateWithAnthropic(apiKey, model, prompt, currentHtml)
              : await generateWithGemini(apiKey, model, prompt, currentHtml);
          return Response.json({ html: htmlOnly(raw), provider, model });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Errore sconosciuto durante la generazione.";
          return Response.json({ error: message.slice(0, 1000) }, { status: 502 });
        }
      },
    },
  },
});
