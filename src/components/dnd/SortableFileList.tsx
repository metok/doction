import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFileOrderStore } from "@/lib/stores/file-order";
import type { DriveFile } from "@/lib/google/types";

interface SortableItemProps {
  id: string;
  children: (attrs: {
    setNodeRef: (el: HTMLElement | null) => void;
    style: React.CSSProperties;
    attributes: React.HTMLAttributes<HTMLElement>;
    listeners: Record<string, unknown> | undefined;
    isDragging: boolean;
  }) => React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      {children({ setNodeRef, style, attributes, listeners, isDragging })}
    </>
  );
}

interface SortableFileListProps {
  folderId: string;
  files: DriveFile[];
  viewMode: "grid" | "list";
  renderItem: (
    file: DriveFile,
    attrs: {
      setNodeRef: (el: HTMLElement | null) => void;
      style: React.CSSProperties;
      attributes: React.HTMLAttributes<HTMLElement>;
      listeners: Record<string, unknown> | undefined;
      isDragging: boolean;
    },
  ) => React.ReactNode;
  renderOverlay: (file: DriveFile) => React.ReactNode;
}

export function SortableFileList({
  folderId,
  files,
  viewMode,
  renderItem,
  renderOverlay,
}: SortableFileListProps) {
  const { getOrder, setOrder } = useFileOrderStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Apply saved order (O(1) Map lookup)
  const sortedFiles = useMemo(() => {
    const savedOrder = getOrder(folderId);
    if (!savedOrder || savedOrder.length === 0) return files;
    const orderMap = new Map(savedOrder.map((id, idx) => [id, idx]));
    return [...files].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity;
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity;
      return ai - bi;
    });
  }, [files, folderId, getOrder]);

  const [localFiles, setLocalFiles] = useState<DriveFile[]>(sortedFiles);

  // Keep local files in sync when external files change
  useEffect(() => {
    setLocalFiles(sortedFiles);
  }, [sortedFiles]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setLocalFiles((prev) => {
      const oldIdx = prev.findIndex((f) => f.id === active.id);
      const newIdx = prev.findIndex((f) => f.id === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx);
      setOrder(folderId, reordered.map((f) => f.id));
      return reordered;
    });
  }

  const activeFile = activeId ? localFiles.find((f) => f.id === activeId) : null;
  const strategy =
    viewMode === "grid" ? rectSortingStrategy : verticalListSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localFiles.map((f) => f.id)}
        strategy={strategy}
      >
        {localFiles.map((file) => (
          <SortableItem key={file.id} id={file.id}>
            {(attrs) => renderItem(file, attrs)}
          </SortableItem>
        ))}
      </SortableContext>

      <DragOverlay>
        {activeFile ? renderOverlay(activeFile) : null}
      </DragOverlay>
    </DndContext>
  );
}
