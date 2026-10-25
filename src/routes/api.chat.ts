import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  message: z.string().trim().min(1).max(12000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(12000),
  })).max(12).optional().default([]),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Accept same-origin requests only.
        try {
          const origin = request.headers.get("origin");
          const parsedOrigin = origin ? new URL(origin) : null;
          const requestUrl = new URL(request.url);
          const requestHost = (
            request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
            request.headers.get("host") ||
            requestUrl.host
          ).toLowerCase();
          const requestProtocol = (
            request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
            requestUrl.protocol.replace(":", "")
          ).toLowerCase();
          if (!parsedOrigin || !["http:", "https:"].includes(parsedOrigin.protocol) ||
              parsedOrigin.host.toLowerCase() !== requestHost ||
              parsedOrigin.protocol !== `${requestProtocol}:`) {
            return Response.json({ error: "Origine della richiesta non valida. Ricarica Omni e riprova." }, { status: 403 });
          }
        } catch {
          return Response.json({ error: "Richiesta non valida." }, { status: 400 });
        }

        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Messaggio non valido o troppo lungo." }, { status: 400 });
        }

        const apiKey = typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined;
        if (!apiKey) {
          return Response.json({ error: "OpenAI non è configurato sul server. Aggiungi OPENAI_API_KEY nelle variabili d'ambiente di deployment." }, { status: 503 });
        }

        const { message, history } = parsed.data;
        const conversation = [
          ...history.map((item) => `${item.role === "user" ? "UTENTE" : "OMNI"}: ${item.content}`),
          `UTENTE: ${message}`,
        ].join("\n\n");

        try {
          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
              instructions: [
                "Sei Omni, un assistente generale utile, concreto e capace di ragionare. Rispondi nella lingua dell'utente, di norma in italiano.",
                "La ricerca web è disponibile tramite lo strumento web_search: usalo quando la richiesta riguarda informazioni aggiornate, siti specifici, notizie, prodotti o quando serve verificare fonti.",
                "Non dire in modo generico che non puoi visitare siti web: se serve, usa la ricerca web e cita le fonti fornite dal sistema.",
                "Non affermare di aver aperto, modificato, eseguito o testato un repository, un file o una build se non hai davvero eseguito quell'azione tramite uno strumento disponibile.",
                "Questa chat dispone di ricerca web, ma non dispone ancora di uno strumento GitHub per scrivere file o lanciare build. Se l'utente chiede una modifica diretta a un repository, sii trasparente su questa specifica limitazione e fornisci un piano o una patch concreta, senza fingere di averla applicata.",
                "Per richieste di creazione o modifica di siti, se l'utente vuole un risultato visivo generato in Omni, guidalo verso OmniStudio; non sostenere di aver modificato un sito live senza averlo fatto.",
                "Evita preamboli inutili. Se non sai qualcosa, dillo chiaramente e indica come verificarla."
              ].join(" "),
              tools: [{ type: "web_search" }],
              input: conversation,
              max_output_tokens: 5000,
            }),
          });
          const data = await response.json() as {
            error?: { message?: string };
            output_text?: string;
            output?: { content?: { type?: string; text?: string }[] }[];
          };
          if (!response.ok) {
            return Response.json({ error: data.error?.message ?? `OpenAI ha risposto con HTTP ${response.status}.` }, { status: 502 });
          }
          const answer = data.output_text ?? data.output
            ?.flatMap((item) => item.content ?? [])
            .filter((part) => part.type === "output_text" || part.type === "text")
            .map((part) => part.text ?? "")
            .join("");
          if (!answer?.trim()) {
            return Response.json({ error: "Il modello non ha restituito una risposta. Riprova." }, { status: 502 });
          }
          return Response.json({ answer });
        } catch {
          return Response.json({ error: "Errore di connessione al servizio AI. Riprova tra poco." }, { status: 502 });
        }
      },
    },
  },
});
