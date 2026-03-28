import { createFileRoute } from "@tanstack/react-router";
import { FolderPageContent } from "@/components/content/FolderPageContent";

export const Route = createFileRoute("/folder/$folderId")({
  component: FolderPage,
});

function FolderPage() {
  const { folderId } = Route.useParams();
  return <FolderPageContent folderId={folderId} />;
}
