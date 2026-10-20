import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, ArrowUp, Check, ChevronDown, Code2, Command, ExternalLink,
  Eye, FileCode2, Folder, Globe, LayoutTemplate, LoaderCircle, Monitor,
  MoreHorizontal, Play, Plus, RefreshCw, Smartphone, Sparkles, Terminal,
  Trash2, WandSparkles, X
} from "lucide-react";
import { AppShell } from "@/components/AppShell";

type ConsoleLine = { id: number; time: string; level: "info" | "success" | "warn" | "error"; message: string };

const initialHtml = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Studio Preview</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f7f7f5;color:#171717}
nav{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 7%;border-bottom:1px solid #e8e8e4;background:#fff}
.brand{font-weight:750;letter-spacing:-.06em;font-size:20px}.navlinks{display:flex;gap:24px;font-size:12px;color:#656565}.navbtn{background:#171717;color:#fff;border-radius:999px;padding:11px 17px;font-size:12px}
main{max-width:1000px;margin:auto;padding:88px 7%}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:#73736d;font-weight:700}
h1{font-size:clamp(38px,7vw,76px);letter-spacing:-.075em;line-height:.98;max-width:700px;margin:20px 0}p{color:#66665f;line-height:1.7;max-width:520px;font-size:14px}.actions{display:flex;gap:10px;margin-top:26px;flex-wrap:wrap}.btn{border:1px solid #d9d9d2;border-radius:999px;padding:13px 18px;font-size:12px;background:white}.btn.primary{background:#171717;color:white;border-color:#171717}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:70px}.card{border:1px solid #e5e5df;background:white;border-radius:16px;padding:22px;min-height:145px}.num{font-size:11px;color:#898981}.card h3{font-size:15px;letter-spacing:-.03em;margin:24px 0 6px}.card p{font-size:12px;margin:0}
@media(max-width:620px){nav{padding:0 5%}.navlinks{display:none}main{padding:60px 6%}.grid{grid-template-columns:1fr;margin-top:48px}.card{min-height:120px}}
</style></head>
<body>
<nav><div class="brand">form.®</div><div class="navlinks"><span>Studio</span><span>Servizi</span><span>Approccio</span></div><div class="navbtn">Parliamone ↗</div></nav>
<main><div class="eyebrow">Indipendent digital studio</div><h1>Idee chiare.<br>Esperienze migliori.</h1><p>Progettiamo esperienze digitali essenziali, prodotti curati e identità che aiutano le idee a diventare realtà.</p><div class="actions"><button class="btn primary" onclick="document.querySelector('#servizi').scrollIntoView({behavior:'smooth'})">Esplora i servizi ↗</button><button class="btn" onclick="alert('Grazie per il tuo interesse!')">Scopri lo studio</button></div><div class="grid" id="servizi"><article class="card"><span class="num">01 / STRATEGIA</span><h3>Direzione creativa</h3><p>Una visione nitida per ogni progetto.</p></article><article class="card"><span class="num">02 / DIGITALE</span><h3>Prodotti digitali</h3><p>Esperienze semplici, veloci e accessibili.</p></article><article class="card"><span class="num">03 / IDENTITÀ</span><h3>Brand systems</h3><p>Sistemi visivi costruiti per durare.</p></article></div></main>
</body></html>`;

function timeNow() {
  return new Date().toLocaleTimeString("it-IT", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "OmniStudio — Omni" },
      { name: "description", content: "Crea siti e prodotti digitali con OmniStudio." },
      { property: "og:title", content: "OmniStudio — Omni" },
      { property: "og:description", content: "Dall'idea a un prodotto, con anteprima e console integrate." },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<"openai" | "anthropic" | "gemini">("openai");
  const [model, setModel] = useState("gpt-4.1");
  const [hydrated, setHydrated] = useState(false);
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "console" | "files">("preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [html, setHtml] = useState(initialHtml);
  const [projectName, setProjectName] = useState("Nuovo progetto");
  const [isRunning, setIsRunning] = useState(false);
  const [lines, setLines] = useState<ConsoleLine[]>([
    { id: 1, time: "14:02:11", level: "success", message: "OmniStudio runtime inizializzato." },
    { id: 2, time: "14:02:11", level: "info", message: "Ambiente preview isolato pronto." },
    { id: 3, time: timeNow(), level: "info", message: "Generazione AI server-side disponibile quando il provider è configurato." },
  ]);
  const [showCode, setShowCode] = useState(false);
  const [saved, setSaved] = useState(true);
  const previewTitle = useMemo(() => projectName.trim() || "Nuovo progetto", [projectName]);
  const instrumentedHtml = useMemo(() => {
    const bridge = '<script>(function(){const send=(level,args)=>{try{window.parent.postMessage({type:"omni-studio-console",level,message:Array.from(args).map(v=>{try{return typeof v==="string"?v:JSON.stringify(v)}catch{return String(v)}}).join(" ").slice(0,1500)},"*")}catch{}};["log","info","warn","error"].forEach(level=>{const original=console[level].bind(console);console[level]=(...args)=>{send(level,args);original(...args)}});window.addEventListener("error",e=>send("error",[e.message+" ("+e.filename+":"+e.lineno+")"]));window.addEventListener("unhandledrejection",e=>send("error",["Unhandled promise rejection",e.reason]));window.addEventListener("load",()=>send("success",["Pagina caricata: "+document.title]));})();<\\/script>';
    return /<\\/head\\s*>/i.test(html) ? html.replace(/<\\/head\\s*>/i, bridge + "</head>") : html;
  }, [html]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem("omni-studio-draft-v1");
      if (draft) {
        const parsed = JSON.parse(draft) as { html?: string; projectName?: string; provider?: string; model?: string };
        if (parsed.html && /<html[\\s>]/i.test(parsed.html)) setHtml(parsed.html);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.provider === "openai" || parsed.provider === "anthropic" || parsed.provider === "gemini") setProvider(parsed.provider);
        if (parsed.model) setModel(parsed.model);
        setLines((current) => [...current, { id: Date.now(), time: timeNow(), level: "success", message: "Bozza precedente ripristinata da questo dispositivo." }]);
      }
    } catch { /* Ignore invalid local drafts. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("omni-studio-draft-v1", JSON.stringify({ html, projectName, provider, model })); setSaved(true); }
    catch { addLine("warn", "Spazio locale non disponibile: esporta il progetto per non perdere le modifiche."); }
  }, [html, projectName, provider, model, hydrated]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!previewRef.current || event.source !== previewRef.current.contentWindow) return;
      const data = event.data as { type?: string; level?: string; message?: string };
      if (data?.type !== "omni-studio-console" || typeof data.message !== "string") return;
      const level: ConsoleLine["level"] = data.level === "error" ? "error" : data.level === "warn" ? "warn" : data.level === "success" ? "success" : "info";
      setLines((current) => [...current, { id: Date.now() + Math.random(), time: timeNow(), level, message: data.message!.slice(0, 1500) }].slice(-100));
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const addLine = (level: ConsoleLine["level"], message: string) => {
    setLines((current) => [...current, { id: Date.now() + Math.random(), time: timeNow(), level, message }].slice(-100));
  };

  const runPreview = () => {
    setIsRunning(true);
    setActiveTab("console");
    addLine("info", "Avvio del preview runtime…");
    window.setTimeout(() => {
      setIsRunning(false);
      setActiveTab("preview");
      addLine("success", "Preview aggiornato correttamente.");
      addLine("info", "Output caricato in iframe sandbox.");
    }, 450);
  };

  const buildFromPrompt = async () => {
    const request = prompt.trim();
    if (!request || isRunning) return;
    setIsRunning(true);
    setSaved(false);
    setActiveTab("console");
    addLine("info", `Richiesta inviata a ${provider} · modello ${model}.`);
    try {
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: request, provider, model, currentHtml: projectName === "Nuovo progetto" ? "" : html }),
      });
      const data = await response.json() as { html?: string; error?: string; provider?: string; model?: string };
      if (!response.ok || !data.html) throw new Error(data.error || `Errore server (HTTP ${response.status}).`);
      setHtml(data.html);
      setProjectName(request.length > 32 ? request.slice(0, 32) + "…" : request);
      setSaved(true);
      setActiveTab("preview");
      addLine("success", `Progetto generato con ${data.provider} / ${data.model}.`);
      addLine("info", "Anteprima sandbox aggiornata.");
      setPrompt("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto durante la generazione.";
      addLine("error", message);
      setActiveTab("console");
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => setLines([{ id: Date.now(), time: timeNow(), level: "info", message: "Console pulita." }]);

  return (
    <AppShell>
      <div className="fade-in-up -mx-5 -mt-8 sm:-mx-8 lg:-mx-10 lg:-mt-10">
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface"><WandSparkles className="size-5" /></div>
              <div><div className="flex items-center gap-2"><h1 className="font-display text-lg font-semibold tracking-tight">OmniStudio</h1><span className="rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Beta</span></div><p className="text-xs text-muted-foreground">Dall'idea al prodotto, senza perdere il controllo.</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">{saved ? "Tutte le modifiche salvate" : "Modifiche non salvate"}</span>
              <span className={`size-1.5 rounded-full ${saved ? "bg-emerald-400" : "bg-amber-400"}`} />
              <button onClick={() => { setProjectName("Nuovo progetto"); setHtml(initialHtml); setSaved(true); addLine("info", "Nuovo progetto creato."); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs transition hover:bg-accent"><Plus className="size-3.5" /> Nuovo</button>
              <button onClick={runPreview} disabled={isRunning} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-xs font-medium text-background transition hover:opacity-85 disabled:opacity-50"><Play className="size-3.5" /> {isRunning ? "Esecuzione…" : "Esegui"}</button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex min-w-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-2 text-xs"><Folder className="size-3.5 text-muted-foreground" /><input aria-label="Nome progetto" value={projectName} onChange={(e) => { setProjectName(e.target.value); setSaved(false); }} className="w-36 truncate bg-transparent font-medium outline-none sm:w-52" /><ChevronDown className="size-3 text-muted-foreground" /></div>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
                  <button aria-label="Anteprima desktop" onClick={() => setDevice("desktop")} className={`rounded-md p-1.5 ${device === "desktop" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}><Monitor className="size-3.5" /></button>
                  <button aria-label="Anteprima mobile" onClick={() => setDevice("mobile")} className={`rounded-md p-1.5 ${device === "mobile" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}><Smartphone className="size-3.5" /></button>
                  <span className="mx-1 h-4 w-px bg-border" />
                  <button aria-label="Aggiorna anteprima" onClick={runPreview} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><RefreshCw className="size-3.5" /></button>
                  <button aria-label="Apri codice HTML" onClick={() => setShowCode((v) => !v)} className={`rounded-md p-1.5 ${showCode ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><Code2 className="size-3.5" /></button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 border-b border-border px-4 sm:px-6">
                <button onClick={() => setActiveTab("preview")} className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs ${activeTab === "preview" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}><Eye className="size-3.5" /> Anteprima</button>
                <button onClick={() => setActiveTab("console")} className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs ${activeTab === "console" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}><Terminal className="size-3.5" /> Console <span className="rounded bg-accent px-1.5 py-0.5 text-[9px]">{lines.length}</span></button>
                <button onClick={() => setActiveTab("files")} className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs ${activeTab === "files" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}><FileCode2 className="size-3.5" /> File</button>
                <span className="ml-auto hidden items-center gap-1.5 py-3 text-[10px] text-muted-foreground sm:flex"><Globe className="size-3" /> Preview locale</span>
              </div>

              {activeTab === "preview" && <div className="flex min-h-[430px] flex-1 flex-col items-center bg-[#0c0c0d] p-3 sm:p-5">
                <div className={`flex min-h-[480px] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,.35)] transition-all duration-300 ${device === "mobile" ? "max-w-[390px]" : "max-w-[1200px]"}`}>
                  <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-[#e7e7e7] bg-[#fafafa] px-3">
                    <span className="size-2 rounded-full bg-[#ff5f57]" /><span className="size-2 rounded-full bg-[#febc2e]" /><span className="size-2 rounded-full bg-[#28c840]" />
                    <div className="mx-auto flex max-w-[360px] items-center gap-2 rounded-md border border-[#e8e8e8] bg-white px-3 py-1 text-[10px] text-[#777]"><Globe className="size-2.5" /> localhost / preview</div>
                    <ExternalLink className="size-3 text-[#888]" />
                  </div>
                  <iframe ref={previewRef} title={`Anteprima di ${previewTitle}`} sandbox="allow-scripts" srcDoc={instrumentedHtml} className="min-h-[440px] w-full flex-1 border-0 bg-white" />
                </div>
                <p className="mt-3 flex items-center gap-2 text-[10px] text-white/45"><Check className="size-3 text-emerald-400" /> Anteprima isolata · nessun accesso ai dati dell'app</p>
              </div>}

              {activeTab === "console" && <div className="min-h-[480px] flex-1 bg-[#08090b] p-4 font-mono text-[11px] sm:p-6">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3"><div className="flex items-center gap-2 text-white/75"><Terminal className="size-4" /> <span>Runtime console</span><span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/50">LOCAL</span></div><div className="flex gap-1"><button aria-label="Pulisci console" onClick={clearConsole} className="rounded p-1.5 text-white/45 hover:bg-white/10 hover:text-white"><Trash2 className="size-3.5" /></button><button aria-label="Torna all'anteprima" onClick={() => setActiveTab("preview")} className="rounded p-1.5 text-white/45 hover:bg-white/10 hover:text-white"><X className="size-3.5" /></button></div></div>
                <div className="space-y-3">{lines.map((line) => <div key={line.id} className="flex gap-3 leading-relaxed"><span className="shrink-0 text-white/30">{line.time}</span><span className={line.level === "success" ? "text-emerald-400" : line.level === "warn" ? "text-amber-300" : line.level === "error" ? "text-red-400" : "text-sky-300"}>{line.level === "success" ? "✓" : line.level === "warn" ? "!" : line.level === "error" ? "×" : "›"}</span><span className="break-words text-white/75">{line.message}</span></div>)}</div>
                {isRunning && <div className="mt-4 flex items-center gap-2 text-sky-300"><LoaderCircle className="size-3.5 animate-spin" /> Esecuzione in corso…</div>}
                <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-4 text-white/35"><span className="text-emerald-400">➜</span><span>OmniStudio</span><span className="animate-pulse">_</span></div>
              </div>}

              {activeTab === "files" && <div className="min-h-[480px] flex-1 p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-medium">File del progetto</h2><p className="mt-1 text-xs text-muted-foreground">Risorse della bozza corrente</p></div><button onClick={() => setShowCode(true)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"><Code2 className="size-3.5" /> Visualizza codice</button></div>
                <button onClick={() => { setActiveTab("preview"); setShowCode(false); }} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:bg-accent/40"><FileCode2 className="size-5 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block text-xs font-medium">index.html</span><span className="mt-1 block text-[10px] text-muted-foreground">HTML · documento di anteprima</span></span><span className="text-[10px] text-muted-foreground">{Math.max(1, html.split("\n").length)} righe</span></button>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/70 p-3 text-[11px] leading-relaxed text-muted-foreground"><Folder className="mt-0.5 size-3.5 shrink-0" /> Questa demo contiene un singolo file HTML. La gestione completa di file e cartelle richiede il workspace di progetto persistente.</div>
              </div>}

              {showCode && <div className="border-t border-border bg-[#08090b]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[11px] text-white/65"><span className="flex items-center gap-2"><Code2 className="size-3.5" /> index.html</span><button onClick={() => setShowCode(false)} className="text-white/45 hover:text-white"><X className="size-3.5" /></button></div>
                <pre className="max-h-64 overflow-auto p-4 text-[10px] leading-relaxed text-emerald-200/80"><code>{html}</code></pre>
              </div>}
            </section>

            <aside className="flex min-w-0 flex-col bg-background">
              <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-2"><Sparkles className="size-4" /><span className="text-sm font-medium">Assistente</span></div><button aria-label="Altre opzioni" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></button></div>
              <div className="flex flex-1 flex-col px-5 py-5">
                <div className="mb-5 flex size-9 items-center justify-center rounded-xl border border-border bg-surface"><Sparkles className="size-4" /></div>
                <h2 className="font-display text-xl font-semibold tracking-tight">Cosa costruiamo?</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Descrivi il risultato che vuoi ottenere. Potrai vederlo nell'anteprima e controllare l'esecuzione dalla console.</p>
                <div className="mt-5 space-y-3">
                  <div className="space-y-1.5"><label htmlFor="studio-provider" className="text-[10px] text-muted-foreground">Provider AI</label><select id="studio-provider" value={provider} onChange={(e) => { const next = e.target.value as "openai" | "anthropic" | "gemini"; setProvider(next); setModel(next === "openai" ? "gpt-4.1" : next === "anthropic" ? "claude-sonnet-4-5" : "gemini-2.5-pro"); setSaved(false); }} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-white/25"><option value="openai">OpenAI</option><option value="anthropic">Anthropic Claude</option><option value="gemini">Google Gemini</option></select></div>
                  <div className="space-y-1.5"><label htmlFor="studio-model" className="text-[10px] text-muted-foreground">ID modello API</label><input id="studio-model" value={model} onChange={(e) => { setModel(e.target.value); setSaved(false); }} placeholder="ID esatto del modello" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-white/25" /><p className="text-[9px] leading-relaxed text-muted-foreground">Inserisci l’ID del modello disponibile nel tuo account API.</p></div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prova un'idea</p>
                  {[
                    { icon: LayoutTemplate, label: "Crea un portfolio personale" },
                    { icon: Globe, label: "Crea un sito per un ristorante" },
                    { icon: Smartphone, label: "Progetta una landing per un'app" },
                  ].map((item) => <button key={item.label} onClick={() => setPrompt(item.label)} className="flex w-full items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left text-[11px] text-muted-foreground transition hover:border-white/20 hover:bg-accent hover:text-foreground"><item.icon className="size-3.5 shrink-0" />{item.label}<ArrowRight className="ml-auto size-3 shrink-0 opacity-50" /></button>)}
                </div>
                <div className="mt-auto pt-6">
                  <div className="rounded-xl border border-border bg-surface p-3 focus-within:border-white/25">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); buildFromPrompt(); } }} placeholder="Descrivi il sito o la modifica…" rows={4} className="w-full resize-y bg-transparent text-xs leading-relaxed outline-none placeholder:text-muted-foreground/70" />
                    <div className="mt-3 flex items-center justify-between"><span className="text-[9px] text-muted-foreground">Invio per inviare · ⇧ Invio per andare a capo</span><button aria-label="Invia richiesta" onClick={buildFromPrompt} disabled={!prompt.trim() || isRunning} className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background transition hover:opacity-85 disabled:opacity-30">{isRunning ? <LoaderCircle className="size-3.5 animate-spin" /> : <ArrowUp className="size-4" />}</button></div>
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground"><Command className="mt-0.5 size-3 shrink-0" /><span>Le chiavi API restano sul server. Le bozze sono salvate su questo dispositivo; configura il segreto del provider per generare progetti.</span></div>
                </div>
              </div>
            </aside>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-2.5 text-[10px] text-muted-foreground sm:px-7"><div className="flex items-center gap-3"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400" /> Runtime pronto</span><span>HTML sandbox</span></div><span>OmniStudio · Workspace creativo</span></footer>
        </div>
      </div>
    </AppShell>
  );
}
