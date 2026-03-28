import { createFileRoute } from "@tanstack/react-router";
import { TrashPageContent } from "@/components/content/TrashPageContent";

export const Route = createFileRoute("/trash")({
  component: TrashPageContent,
});
