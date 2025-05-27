import ClientProfile from "./components/ClientProfile";
// TopBar import removed
// import TopBar from "@/components/layouts/Topbar";

export default function ClientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      {/* <TopBar /> Removed */}
      <ClientProfile clientId={params.id} />
    </div>
  );
}
