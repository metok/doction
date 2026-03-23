import { createFileRoute } from "@tanstack/react-router";

function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold text-gray-100">Home</h1>
      <p className="text-gray-400">Your Google Drive workspace</p>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
