"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@mcw/ui";
import DiagnosisRows from "../components/DiagnosisRows";
import DocumentationHistorySidebar from "../../components/DocumentationHistorySidebar";
import { ClientInfoHeader } from "../../components/ClientInfoHeader";
import {
  createDiagnosisTreatmentPlan,
  fetchSingleClientGroup,
} from "@/(dashboard)/clients/services/client.service";
import { showErrorToast } from "@mcw/utils";
import { ClientGroupFromAPI } from "../../edit/components/ClientEdit";

interface DiagnosisData {
  code: string;
  description: string;
  id?: string;
}

export default function NewDiagnosisAndTreatmentPlan() {
  const params = useParams();
  const router = useRouter();
  const clientGroupId = params.id as string;
  const [clientInfo, setClientInfo] = useState<ClientGroupFromAPI | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisData[]>([
    { code: "", description: "" },
  ]);
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get the first client's ID from the client group
  const clientId = clientInfo?.ClientGroupMembership[0]?.Client?.id;

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

  const addDiagnosis = () =>
    setDiagnoses([...diagnoses, { code: "", description: "" }]);
  const removeDiagnosis = (idx: number) => {
    if (diagnoses.length === 1) return; // Prevent removing the last row
    setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  };
  const updateDiagnosis = (idx: number, updates: Partial<DiagnosisData>) => {
    setDiagnoses((prevDiagnoses) => {
      const updatedDiagnoses = [...prevDiagnoses];
      updatedDiagnoses[idx] = { ...updatedDiagnoses[idx], ...updates };
      return updatedDiagnoses;
    });
  };

  const handleSave = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client information not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const dateTime = `${date}T${time}:00`;

      // Only include diagnoses that have both code and ID
      const validDiagnoses = diagnoses.filter((d) => d.code && d.id);

      const [response, error] = await createDiagnosisTreatmentPlan({
        body: {
          clientId,
          clientGroupId,
          title: "Diagnosis and Treatment Plan",
          diagnoses: validDiagnoses,
          dateTime,
        },
      });

      if (error) {
        showErrorToast(toast, error);
      } else {
        toast({
          title: "Success",
          description: "Diagnosis and treatment plan saved successfully",
        });

        // Redirect to the saved plan using the plan ID
        if (response && typeof response === "object" && "id" in response) {
          router.push(
            `/clients/${params.id}/diagnosisAndTreatmentPlan/${response.id}`,
          );
        } else {
          // Fallback if response doesn't have id
          router.push(`/clients/${params.id}/diagnosisAndTreatmentPlan`);
        }
      }
    } catch (error) {
      showErrorToast(toast, error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipToTreatmentPlan = () => {
    // Navigate to template selection page
    handleSave();
  };

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      <ClientInfoHeader
        clientGroupId={clientGroupId}
        clientInfo={clientInfo}
        showDocumentationHistory={true}
        onDocumentationHistoryClick={() => setSidebarOpen(true)}
      />

      <DiagnosisRows
        addDiagnosis={addDiagnosis}
        date={date}
        diagnoses={diagnoses}
        removeDiagnosis={removeDiagnosis}
        renderSkipLink={
          <button
            className="text-[#2d8467] hover:underline"
            disabled={isSaving}
            type="button"
            onClick={handleSkipToTreatmentPlan}
          >
            Skip to treatment plan
          </button>
        }
        setDate={setDate}
        setTime={setTime}
        time={time}
        updateDiagnosis={updateDiagnosis}
        onSave={handleSave}
      />

      <DocumentationHistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
