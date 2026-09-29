import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModulePage } from "@/components/ModulePage";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/allenamento")({
  head: () => ({
    meta: [
      { title: "Allenamento — Omna" },
      { name: "description", content: "Schede, sessioni e progressi fisici." },
      { property: "og:title", content: "Allenamento — Omna" },
      { property: "og:description", content: "Schede, sessioni e progressi fisici." },
    ],
  }),
  component: () => (
    <AppShell>
      <ModulePage module={getModule("/allenamento")!} />
    </AppShell>
  ),
});
