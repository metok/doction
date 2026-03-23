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
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
