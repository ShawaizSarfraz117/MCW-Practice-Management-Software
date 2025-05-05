import ClientEdit from "./components/ClientEdit";

export default function ClientEditPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 overflow-auto">
      <ClientEdit clientGroupId={params.id} />
    </div>
  );
}
