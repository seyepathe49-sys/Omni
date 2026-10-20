import {
  Activity,
  BookOpen,
  CalendarDays,
  CheckSquare,
  LayoutGrid,
  MessagesSquare,
  NotebookPen,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type OmnaModule = {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  group: "core" | "life";
};

export const MODULES: OmnaModule[] = [
  {
    to: "/",
    label: "Chat",
    icon: MessagesSquare,
    description: "Parla con Omni e crea siti direttamente nella chat.",
    group: "core",
  },
  {
    to: "/attivita",
    label: "Attività",
    icon: CheckSquare,
    description: "Task, progetti e scadenze in un unico flusso.",
    group: "core",
  },
  {
    to: "/calendario",
    label: "Calendario",
    icon: CalendarDays,
    description: "Eventi, impegni e pianificazione della settimana.",
    group: "core",
  },
  {
    to: "/note",
    label: "Note",
    icon: NotebookPen,
    description: "Appunti, idee e conoscenza personale.",
    group: "core",
  },
  {
    to: "/finanze",
    label: "Finanze",
    icon: Wallet,
    description: "Spese, budget e obiettivi economici.",
    group: "life",
  },
  {
    to: "/allenamento",
    label: "Allenamento",
    icon: Activity,
    description: "Schede, sessioni e progressi fisici.",
    group: "life",
  },
  {
    to: "/studio",
    label: "OmniStudio",
    icon: BookOpen,
    description: "Workspace dedicato per creare siti, prototipi e prodotti digitali.",
    group: "core",
  },
  {
    to: "/profilo",
    label: "Dati personali",
    icon: User,
    description: "Identità, documenti e metriche personali.",
    group: "life",
  },
];

export const getModule = (to: string) => MODULES.find((m) => m.to === to);
