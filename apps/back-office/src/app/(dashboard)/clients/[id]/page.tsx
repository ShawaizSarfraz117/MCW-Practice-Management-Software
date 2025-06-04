import ClientProfile from "./components/ClientProfile";
// TopBar import removed
// import TopBar from "@/components/layouts/Topbar";

export default function ClientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex-1 overflow-auto">
      {/* <TopBar /> Removed */}
      <ClientProfile clientId={params.id} />
    </div>
  );
}
