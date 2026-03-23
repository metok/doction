import { createFileRoute } from "@tanstack/react-router";

function DocPage() {
  const { docId } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Document</h1>
      <p className="mt-2 text-gray-400">
        Doc ID: <code className="text-indigo-400">{docId}</code>
      </p>
    </div>
  );
}

export const Route = createFileRoute("/doc/$docId")({
  component: DocPage,
});
