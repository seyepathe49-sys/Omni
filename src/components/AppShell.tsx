import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Settings, Command, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups: { key: string; title: string }[] = [
    { key: "core", title: "Operatività" },
    { key: "life", title: "Vita personale" },
  ];

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto scrollbar-thin px-3 py-4">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-2 px-3 text-[11px] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {MODULES.filter((m) => m.group === group.key).map((m) => {
              const active = m.to === "/" ? pathname === "/" : pathname.startsWith(m.to);
              return (
                <li key={m.to}>
                  <Link
                    to={m.to}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-200",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 h-4 w-0.5 rounded-full bg-foreground" />
                    )}
                    <m.icon
                      className={cn(
                        "size-4 transition-colors duration-200",
                        active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                      )}
                      strokeWidth={1.75}
                    />
                    <span className="font-medium">{m.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-foreground">
          <span className="font-display text-[13px] font-semibold text-background">O</span>
        </div>
        <span className="font-display text-[15px] font-semibold tracking-tight">Omna</span>
        <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          v0.1
        </span>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-muted-foreground transition-colors duration-200 hover:border-input hover:text-foreground"
        >
          <Search className="size-3.5" strokeWidth={1.75} />
          <span>Cerca ovunque…</span>
          <kbd className="ml-auto flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Command className="size-2.5" />K
          </kbd>
        </button>
      </div>

      <NavLinks onNavigate={onNavigate} />

      {/* Footer */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] text-muted-foreground transition-colors duration-200 hover:bg-accent/50 hover:text-foreground"
        >
          <Settings className="size-4" strokeWidth={1.75} />
          <span className="font-medium">Impostazioni</span>
        </button>
        <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
            PS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">Pathe Seye</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="pulse-dot inline-block size-1.5 rounded-full bg-emerald-400" />
              Sistema operativo personale
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-background lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          aria-label="Apri menu"
          onClick={() => setMobileOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <Menu className="size-4" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground">
            <span className="font-display text-[11px] font-semibold text-background">O</span>
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">Omna</span>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r border-border bg-background transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            aria-label="Chiudi menu"
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-14 lg:pt-0 lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">{children}</div>
      </main>
    </div>
  );
}
