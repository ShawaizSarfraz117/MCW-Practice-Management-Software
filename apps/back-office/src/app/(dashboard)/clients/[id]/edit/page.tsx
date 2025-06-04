import ClientEdit from "./components/ClientEdit";

export default function ClientEditPage({ params }: { params: { id: string } }) {
  return <ClientEdit clientGroupId={params.id} />;
}
