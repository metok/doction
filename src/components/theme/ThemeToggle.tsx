import { Moon, Sun, Monitor } from "lucide-react";
import { usePreferencesStore } from "@/lib/stores/preferences";

type Theme = "dark" | "light" | "system";

const CYCLE: Theme[] = ["dark", "light", "system"];

const LABELS: Record<Theme, string> = {
  dark: "Dark mode",
  light: "Light mode",
  system: "System theme",
};

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") return <Moon className="h-4 w-4" />;
  if (theme === "light") return <Sun className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

export function ThemeToggle() {
  const { theme, setTheme } = usePreferencesStore();

  function cycleTheme() {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  }

  return (
    <button
      onClick={cycleTheme}
      className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
