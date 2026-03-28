import { createFileRoute } from "@tanstack/react-router";
import { FilePageContent } from "@/components/content/FilePageContent";

export const Route = createFileRoute("/file/$fileId")({
  component: FilePage,
});

function FilePage() {
  const { fileId } = Route.useParams();
  return <FilePageContent fileId={fileId} />;
}
