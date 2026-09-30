import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, Mic, Paperclip, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Omna — Home" },
      {
        name: "description",
        content: "La tua interfaccia personale per pensare, creare e agire con Omna.",
      },
      { property: "og:title", content: "Omna — Home" },
      {
        property: "og:description",
        content: "La tua interfaccia personale per pensare, creare e agire con Omna.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = [
    "Cosa devo fare oggi?",
    "Aiutami a organizzare la giornata",
    "Fammi un piano per questa settimana",
  ];

  return (
    <AppShell>
      <div className="omna-home fade-in-up">
        <section className="omna-hero" aria-label="Chat con Omna">
          <div className="omna-orb-wrap" aria-hidden="true">
            <div className="omna-orb omna-orb-a" />
            <div className="omna-orb omna-orb-b" />
            <div className="omna-orb omna-orb-c" />
            <div className="omna-orb-core">
              <Sparkles className="size-5 text-white/90" strokeWidth={1.5} />
            </div>
          </div>

          <p className="mt-2 text-[12px] font-medium tracking-[0.18em] text-muted-foreground/80 uppercase">
            Il tuo spazio
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Come posso aiutarti?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Scrivi un obiettivo, una domanda o qualcosa che vuoi fare. Omna può aiutarti a
            trasformarlo nel prossimo passo.
          </p>

          <form
            className={`omna-composer mt-8 ${focused ? "is-focused" : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              if (!prompt.trim()) return;
              setPrompt("");
            }}
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                aria-label="Allega"
                className="omna-icon-button"
              >
                <Paperclip className="size-[17px]" strokeWidth={1.7} />
              </button>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder="Chiedi a Omna..."
                aria-label="Messaggio"
                className="omna-textarea"
              />

              <button
                type="button"
                aria-label="Parla con Omna"
                className="omna-icon-button hidden sm:flex"
              >
                <Mic className="size-[17px]" strokeWidth={1.7} />
              </button>

              <button
                type="submit"
                aria-label="Invia"
                disabled={!prompt.trim()}
                className="omna-send"
              >
                <ArrowUp className="size-[17px]" strokeWidth={2} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[10px] text-muted-foreground/60">
                Invio per mandare · Shift + Invio per andare a capo
              </span>
              <span className="hidden text-[10px] text-muted-foreground/60 sm:block">
                Omna
              </span>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setPrompt(suggestion)}
                className="omna-suggestion"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
