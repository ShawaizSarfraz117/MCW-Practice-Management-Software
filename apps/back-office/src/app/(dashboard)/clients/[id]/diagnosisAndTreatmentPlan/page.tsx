"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "@mcw/ui";
import DiagnosisRows from "./components/DiagnosisRows";
import TreatmentPlanTemplate from "./components/TreatmentPlanTemplate";
import DocumentationHistorySidebar from "../components/DocumentationHistorySidebar";
import { ClientInfoHeader } from "../components/ClientInfoHeader";
import {
  createDiagnosisTreatmentPlan,
  fetchSingleClientGroup,
} from "@/(dashboard)/clients/services/client.service";
import { showErrorToast } from "@mcw/utils";
import { ClientGroupFromAPI } from "../edit/components/ClientEdit";

interface DiagnosisData {
  code: string;
  description: string;
  id?: string;
}

export default function DiagnosisAndTreatmentPlan() {
  const params = useParams();
  const clientGroupId = params.id as string;
  const [clientInfo, setClientInfo] = useState<ClientGroupFromAPI | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisData[]>([
    { code: "", description: "" },
  ]);
  const [date, setDate] = useState("2025-03-29");
  const [time, setTime] = useState("19:08");
  const [showTreatmentPlan, setShowTreatmentPlan] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_isSaving, setIsSaving] = useState(false);

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

      if (validDiagnoses.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one diagnosis from the dropdown",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const [_response, error] = await createDiagnosisTreatmentPlan({
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
        setShowTreatmentPlan(true);
      }
    } catch (error) {
      showErrorToast(toast, error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      <ClientInfoHeader
        clientInfo={clientInfo}
        clientGroupId={clientGroupId}
        showDocumentationHistory={true}
        onDocumentationHistoryClick={() => setSidebarOpen(true)}
      />

      {!showTreatmentPlan ? (
        <DiagnosisRows
          addDiagnosis={addDiagnosis}
          date={date}
          diagnoses={diagnoses}
          removeDiagnosis={removeDiagnosis}
          renderSkipLink={
            <button
              className="text-[#2d8467] hover:underline"
              type="button"
              onClick={() => setShowTreatmentPlan(true)}
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
      ) : (
        <TreatmentPlanTemplate />
      )}
      <DocumentationHistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
