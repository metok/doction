import { Link, useRouterState } from "@tanstack/react-router";
import { Clock, Star } from "lucide-react";

const topItems = [
  { label: "Recent", icon: Clock, to: "/recent" },
  { label: "Favorites", icon: Star, to: "/favorites" },
] as const;

export function QuickNav() {
  const { location } = useRouterState();

  return (
    <nav className="flex flex-col gap-0.5">
      {topItems.map(({ label, icon: Icon, to }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
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
