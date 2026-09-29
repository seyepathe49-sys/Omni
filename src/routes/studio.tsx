import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModulePage } from "@/components/ModulePage";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — Omna" },
      { name: "description", content: "Corsi, materiale e abitudini di apprendimento." },
      { property: "og:title", content: "Studio — Omna" },
      { property: "og:description", content: "Corsi, materiale e abitudini di apprendimento." },
    ],
  }),
  component: () => (
    <AppShell>
      <ModulePage module={getModule("/studio")!} />
    </AppShell>
  ),
});
