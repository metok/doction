import { createFileRoute } from "@tanstack/react-router";
import { FavoritesPageContent } from "@/components/content/FavoritesPageContent";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPageContent,
});
