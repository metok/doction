import { createFileRoute } from "@tanstack/react-router";

function FolderPage() {
  const { folderId } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Folder</h1>
      <p className="mt-2 text-gray-400">
        Folder ID: <code className="text-indigo-400">{folderId}</code>
      </p>
    </div>
  );
}

export const Route = createFileRoute("/folder/$folderId")({
  component: FolderPage,
});
