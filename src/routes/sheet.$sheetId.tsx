import { createFileRoute } from "@tanstack/react-router";
import { SheetPageContent } from "@/components/content/SheetPageContent";

export const Route = createFileRoute("/sheet/$sheetId")({
  component: SheetPage,
});

function SheetPage() {
  const { sheetId } = Route.useParams();
  return <SheetPageContent sheetId={sheetId} />;
}
