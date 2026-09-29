import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModulePage } from "@/components/ModulePage";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/finanze")({
  head: () => ({
    meta: [
      { title: "Finanze — Omna" },
      { name: "description", content: "Spese, budget e obiettivi economici." },
      { property: "og:title", content: "Finanze — Omna" },
      { property: "og:description", content: "Spese, budget e obiettivi economici." },
    ],
  }),
  component: () => (
    <AppShell>
      <ModulePage module={getModule("/finanze")!} />
    </AppShell>
  ),
});
