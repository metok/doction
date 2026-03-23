import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Star, Clock, Trash2 } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Favorites", icon: Star, to: "/favorites" },
  { label: "Recent", icon: Clock, to: "/recent" },
  { label: "Trash", icon: Trash2, to: "/trash" },
] as const;

export function QuickNav() {
  const { location } = useRouterState();

  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map(({ label, icon: Icon, to }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
              isActive
                ? "bg-tertiary text-text-primary"
                : "text-text-secondary hover:bg-tertiary hover:text-text-primary"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
