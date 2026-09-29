import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModulePage } from "@/components/ModulePage";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — Omna" },
      { name: "description", content: "Eventi, impegni e pianificazione della settimana." },
      { property: "og:title", content: "Calendario — Omna" },
      {
        property: "og:description",
        content: "Eventi, impegni e pianificazione della settimana.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ModulePage module={getModule("/calendario")!} />
    </AppShell>
  ),
});
