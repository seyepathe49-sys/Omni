import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MODULES } from "@/lib/modules";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panoramica — Omna" },
      {
        name: "description",
        content:
          "Omna è il tuo sistema operativo personale: attività, calendario, note, finanze, allenamento, studio e dati personali in un'unica interfaccia.",
      },
      { property: "og:title", content: "Panoramica — Omna" },
      {
        property: "og:description",
        content: "Il tuo sistema operativo personale, in un'unica interfaccia.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const today = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const quickModules = MODULES.filter((m) => m.to !== "/");

  return (
    <AppShell>
      <div className="fade-in-up">
        <header>
          <p className="text-[13px] font-medium text-muted-foreground capitalize">{today}</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Buonasera, Pathe
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Benvenuto in Omna, il tuo sistema operativo personale. Ogni area della tua vita, in
            un'unica interfaccia.
          </p>
        </header>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              I tuoi moduli
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickModules.map((m, i) => (
              <Link
                key={m.to}
                to={m.to}
                className="group fade-in-up relative rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:border-input hover:bg-surface-raised"
                style={{ animationDelay: `${60 + i * 45}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                    <m.icon className="size-4 text-foreground" strokeWidth={1.75} />
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground group-hover:opacity-100" />
                </div>
                <h3 className="mt-4 text-[15px] font-medium">{m.label}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {m.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
