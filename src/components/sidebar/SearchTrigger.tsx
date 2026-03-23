import { Search } from "lucide-react";

interface SearchTriggerProps {
  onOpen: () => void;
}

export function SearchTrigger({ onOpen }: SearchTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-2 rounded-md bg-tertiary px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="rounded bg-border px-1.5 py-0.5 text-xs font-medium text-text-muted">
        ⌘K
      </kbd>
    </button>
  );
}
