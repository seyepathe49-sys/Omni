import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, CalendarDays, CheckSquare, Globe, LoaderCircle, Maximize2, Minimize2, Paperclip, Sparkles, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";

type ChatMessage = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Omni — Chat" },
    { name: "description", content: "Chatta con Omni, cerca informazioni sul web e crea siti con anteprima direttamente qui." },
  ]}),
  component: Index,
});

function Index() {
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [fullScreen, setFullScreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const suggestions = ["Crea un sito portfolio moderno", "Cerca le ultime novità sull'AI", "Aiutami a pianificare un progetto"];

  const submitPrompt = async (event?: FormEvent) => {
    event?.preventDefault();
    const request = prompt.trim();
    if (!request || isGenerating) return;

    const websiteRequest = /\b(sito|website|landing|pagina web|portfolio|web app|homepage|e-commerce|ecommerce|pagina internet|rifai il sito|redesign|ridisegna)\b/i.test(request);
    setIsGenerating(true);
    setError("");
    setMessages((current) => [...current, { role: "user", content: request }]);
    setPrompt("");

    try {
      if (websiteRequest || html) {
        const response = await fetch("/api/studio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: request, provider: "openai", model: "gpt-4.1", currentHtml: html }),
        });
        const data = await response.json() as { html?: string; error?: string };
        if (!response.ok || !data.html) throw new Error(data.error || `Errore server (HTTP ${response.status}).`);
        setHtml(data.html);
        setProjectName(request.length > 48 ? request.slice(0, 48) + "…" : request);
        setShowPreview(true);
        setMessages((current) => [...current, { role: "assistant", content: "Ho generato una prima versione del sito. Puoi visualizzarla nell'anteprima qui sotto e chiedermi altre modifiche." }]);
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: request, history: messages.slice(-12) }),
        });
        const data = await response.json() as { answer?: string; error?: string };
        if (!response.ok || !data.answer) throw new Error(data.error || `Errore server (HTTP ${response.status}).`);
        setMessages((current) => [...current, { role: "assistant", content: data.answer! }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Non sono riuscito a completare la richiesta. Riprova.";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", content: `Non sono riuscito a completare questa richiesta: ${message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="omna-home fade-in-up">
        <section className="omna-hero" aria-label="Chat con Omni">
          <div className="omna-orb-wrap" aria-hidden="true">
            <div className="omna-orb omna-orb-a" />
            <div className="omna-orb omna-orb-b" />
            <div className="omna-orb omna-orb-c" />
            <div className="omna-orb-core"><Sparkles className="size-5 text-white/90" strokeWidth={1.5} /></div>
          </div>
          <p className="omna-eyebrow">OMNI · CHAT</p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ciao Pathe, cosa facciamo?</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Chiedimi qualsiasi cosa. Posso aiutarti a ragionare, cercare informazioni sul web e creare siti con anteprima direttamente qui.
          </p>

          {messages.length > 0 && <div className="mx-auto mt-8 flex w-full max-w-3xl flex-col gap-4 text-left">
            {messages.map((message, index) => <article key={index} className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "ml-8 border-border bg-surface" : "mr-8 border-border/70 bg-background"}`}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{message.role === "user" ? "Tu" : "Omni"}</p>
              {message.content}
            </article>)}
          </div>}

          {showPreview && html && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-2xl">
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-background"><Globe className="size-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{projectName || "Sito generato"}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Anteprima interattiva · HTML isolato</p></div>
                <button type="button" onClick={() => setFullScreen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"><Maximize2 className="size-3.5" /> Schermo intero</button>
                <button type="button" onClick={() => { setShowPreview(false); setFullScreen(false); }} aria-label="Chiudi anteprima" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button>
              </div>
              <iframe title={projectName || "Anteprima sito Omni"} sandbox="allow-scripts" srcDoc={html} className="h-[520px] w-full border-0 bg-white sm:h-[620px]" />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5"><span className="text-[10px] text-muted-foreground">Puoi chiedere modifiche nella chat qui sotto.</span><button type="button" onClick={() => setPrompt("Modifica il sito esistente: ")} className="text-xs text-foreground underline underline-offset-4">Modifica sito</button></div>
            </section>
          )}

          <form className={`omna-composer mt-8 ${focused ? "is-focused" : ""}`} onSubmit={submitPrompt}>
            <div className="flex items-end gap-2">
              <button type="button" aria-label="Allega" className="omna-icon-button"><Paperclip className="size-[17px]" strokeWidth={1.7} /></button>
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitPrompt(); } }}
                rows={2} placeholder="Chiedi qualsiasi cosa a Omni..." aria-label="Messaggio" className="omna-textarea" />
              <button type="submit" aria-label="Invia" disabled={!prompt.trim() || isGenerating} className="omna-send">{isGenerating ? <LoaderCircle className="size-[17px] animate-spin" /> : <ArrowUp className="size-[17px]" strokeWidth={2} />}</button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[10px] text-muted-foreground/60">Invio · Shift + Invio per andare a capo</span>
              <span className="hidden text-[10px] text-muted-foreground/60 sm:block">OpenAI · GPT-4.1 con ricerca web</span>
            </div>
          </form>
          {isGenerating && <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" /> Omni sta lavorando…</p>}
          {error && <p role="alert" className="mx-auto mt-3 max-w-xl rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-left text-xs leading-relaxed text-red-300">{error}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setPrompt(suggestion); setError(""); }} className="omna-suggestion">{suggestion}</button>)}
          </div>
          <div className="omna-home-grid mt-12 text-left">
            <div className="omna-home-card">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"><CheckSquare className="size-3.5" /> Oggi</div>
              <p className="mt-4 font-display text-lg font-medium">Le tue attività</p><p className="mt-1 text-xs text-muted-foreground">Organizza le priorità da un unico posto</p>
            </div>
            <div className="omna-home-card">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"><CalendarDays className="size-3.5" /> Prossimo</div>
              <p className="mt-4 font-display text-lg font-medium">Il tuo calendario</p><p className="mt-1 text-xs text-muted-foreground">Impegni e pianificazione</p>
            </div>
            <div className="omna-home-card omna-home-card-focus">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Workspace creativo</div>
              <p className="mt-4 font-display text-lg font-medium">OmniStudio</p><p className="mt-1 text-xs text-muted-foreground">Per lavorare su progetti, console e versioni.</p>
            </div>
          </div>
        </section>
      </div>

      {fullScreen && html && <div className="fixed inset-0 z-[100] flex flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Globe className="size-4" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{projectName || "Anteprima sito"}</p><p className="text-[10px] text-muted-foreground">Anteprima a schermo intero</p></div>
          <button type="button" onClick={() => setFullScreen(false)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"><Minimize2 className="size-3.5" /> Esci da schermo intero</button>
        </header>
        <iframe title={projectName || "Anteprima sito Omni a schermo intero"} sandbox="allow-scripts" srcDoc={html} className="min-h-0 w-full flex-1 border-0 bg-white" />
      </div>}
    </AppShell>
  );
}
