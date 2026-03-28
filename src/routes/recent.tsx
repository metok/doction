import { createFileRoute } from "@tanstack/react-router";
import { RecentPageContent } from "@/components/content/RecentPageContent";

export const Route = createFileRoute("/recent")({
  component: RecentPageContent,
});
