import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModulePage } from "@/components/ModulePage";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/profilo")({
  head: () => ({
    meta: [
      { title: "Dati personali — Omna" },
      { name: "description", content: "Identità, documenti e metriche personali." },
      { property: "og:title", content: "Dati personali — Omna" },
      { property: "og:description", content: "Identità, documenti e metriche personali." },
    ],
  }),
  component: () => (
    <AppShell>
      <ModulePage module={getModule("/profilo")!} />
    </AppShell>
  ),
});
