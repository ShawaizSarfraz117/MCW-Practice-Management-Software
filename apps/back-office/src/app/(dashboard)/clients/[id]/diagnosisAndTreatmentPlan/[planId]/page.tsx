"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TreatmentPlanTemplate from "../components/TreatmentPlanTemplate";
import DocumentationHistorySidebar from "../../components/DocumentationHistorySidebar";
import { ClientInfoHeader } from "../../components/ClientInfoHeader";
import { fetchSingleClientGroup } from "@/(dashboard)/clients/services/client.service";
import { ClientGroupFromAPI } from "../../edit/components/ClientEdit";

export default function DiagnosisTreatmentPlanView() {
  const params = useParams();
  const _router = useRouter();
  const clientGroupId = params.id as string;
  const planId = params.planId as string;
  const [clientInfo, setClientInfo] = useState<ClientGroupFromAPI | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get the first client's ID from the client group
  const clientId = clientInfo?.ClientGroupMembership?.[0]?.Client?.id;

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const data = (await fetchSingleClientGroup({
          id: clientGroupId,
          searchParams: {
            includeProfile: "true",
            includeAdress: "true",
          },
        })) as { data: ClientGroupFromAPI } | null;

        if (data?.data) {
          setClientInfo(data.data);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    };

    fetchClientData();
  }, [clientGroupId]);

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      <ClientInfoHeader
        clientInfo={clientInfo}
        clientGroupId={clientGroupId}
        showDocumentationHistory={true}
        onDocumentationHistoryClick={() => setSidebarOpen(true)}
      />

      <TreatmentPlanTemplate clientId={clientId} planId={planId} />

      <DocumentationHistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
