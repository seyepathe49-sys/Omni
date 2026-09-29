import type { OmnaModule } from "@/lib/modules";

export function ModulePage({ module }: { module: OmnaModule }) {
  const Icon = module.icon;
  return (
    <div className="fade-in-up">
      <header className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface">
          <Icon className="size-5 text-foreground" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {module.label}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
        </div>
      </header>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-border bg-surface-raised">
          <Icon className="size-4.5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <h2 className="mt-4 text-sm font-medium">Modulo in preparazione</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          La struttura di navigazione è pronta. I contenuti di questo modulo verranno aggiunti nel
          prossimo passaggio.
        </p>
      </section>
    </div>
  );
}
