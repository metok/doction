import { createFileRoute } from "@tanstack/react-router";
import { HomePageContent } from "@/components/content/HomePageContent";

export const Route = createFileRoute("/")({
  component: HomePageContent,
});
