import { createFileRoute } from "@tanstack/react-router";
import { DocPageContent } from "@/components/content/DocPageContent";

export const Route = createFileRoute("/doc/$docId")({
  component: DocPage,
});

function DocPage() {
  const { docId } = Route.useParams();
  return <DocPageContent docId={docId} />;
}
