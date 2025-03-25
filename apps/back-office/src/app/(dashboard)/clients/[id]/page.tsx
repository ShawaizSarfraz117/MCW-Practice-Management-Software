import ClientProfile from "./components/ClientProfile"
import TopBar from "@/components/layouts/Topbar"

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  return (
      <div className="flex-1 overflow-auto">
        <TopBar />
        <ClientProfile clientId={params.id} />
      </div>
  )
}

