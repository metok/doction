import { createFileRoute } from "@tanstack/react-router";

function SheetPage() {
  const { sheetId } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Spreadsheet</h1>
      <p className="mt-2 text-gray-400">
        Sheet ID: <code className="text-indigo-400">{sheetId}</code>
      </p>
    </div>
  );
}

export const Route = createFileRoute("/sheet/$sheetId")({
  component: SheetPage,
});
