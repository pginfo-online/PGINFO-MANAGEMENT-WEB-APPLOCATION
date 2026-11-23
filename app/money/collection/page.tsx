import CollectionsLedgerTable from "@/components/money/CollectionsLedgerTable";

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
  const { status } = await searchParams;
  const initialStatus = status === "DISPUTED" ? status : "";
  return <CollectionsLedgerTable key={initialStatus} initialStatus={initialStatus} />;
}
