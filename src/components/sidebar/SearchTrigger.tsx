import { Search } from "lucide-react";

interface SearchTriggerProps {
  onOpen: () => void;
}

export function SearchTrigger({ onOpen }: SearchTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-lg bg-bg-tertiary/60 px-3 py-2.5 text-[13px] text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="rounded-md bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-muted">
        ⌘K
      </kbd>
    </button>
  );
}
