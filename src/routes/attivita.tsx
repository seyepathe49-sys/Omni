import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModulePage } from "@/components/ModulePage";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/attivita")({
  head: () => ({
    meta: [
      { title: "Attività — Omna" },
      { name: "description", content: "Task, progetti e scadenze in un unico flusso." },
      { property: "og:title", content: "Attività — Omna" },
      { property: "og:description", content: "Task, progetti e scadenze in un unico flusso." },
    ],
  }),
  component: () => (
    <AppShell>
      <ModulePage module={getModule("/attivita")!} />
    </AppShell>
  ),
});
