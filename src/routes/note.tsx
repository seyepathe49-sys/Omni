import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModulePage } from "@/components/ModulePage";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/note")({
  head: () => ({
    meta: [
      { title: "Note — Omna" },
      { name: "description", content: "Appunti, idee e conoscenza personale." },
      { property: "og:title", content: "Note — Omna" },
      { property: "og:description", content: "Appunti, idee e conoscenza personale." },
    ],
  }),
  component: () => (
    <AppShell>
      <ModulePage module={getModule("/note")!} />
    </AppShell>
  ),
});
