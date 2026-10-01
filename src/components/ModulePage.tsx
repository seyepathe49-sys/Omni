import type { OmnaModule } from "@/lib/modules";

export function ModulePage({ module }: { module: OmnaModule }) {
  const Icon = module.icon;
  return (
    <div className="fade-in-up">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface"><Icon className="size-5 text-foreground" strokeWidth={1.75} /></div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
            <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{module.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>
        <span className="hidden rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:block">In sviluppo</span>
      </header>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="omna-module-stat"><span>Oggi</span><strong>—</strong><small>nessun dato collegato</small></div>
        <div className="omna-module-stat"><span>Prossimo</span><strong>—</strong><small>in attesa di integrazione</small></div>
        <div className="omna-module-stat"><span>Stato</span><strong>Pronto</strong><small>struttura UI disponibile</small></div>
      </div>
      <section className="omna-module-empty mt-4">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-border bg-surface-raised"><Icon className="size-5 text-muted-foreground" strokeWidth={1.6} /></div>
        <h2 className="mt-4 font-display text-base font-medium">{module.label} sta prendendo forma</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          La navigazione e il design system sono pronti. Questo spazio verrà collegato ai dati e alle azioni di Omna senza cambiare la struttura visiva.
        </p>
      </section>
    </div>
  );
}
