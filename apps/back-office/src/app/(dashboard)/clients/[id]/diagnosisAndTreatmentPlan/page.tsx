"use client";

import React, { useState } from "react";
import Link from "next/link";
import DiagnosisRows from "./components/DiagnosisRows";
import TreatmentPlanTemplate from "./components/TreatmentPlanTemplate";
import DocumentationHistorySidebar from "../components/DocumentationHistorySidebar";

export default function DiagnosisAndTreatmentPlan() {
  const [diagnoses, setDiagnoses] = useState([{ code: "", description: "" }]);
  const [date, setDate] = useState("2025-03-29");
  const [time, setTime] = useState("19:08");
  const [showTreatmentPlan, setShowTreatmentPlan] = useState(false); // new state
  const [sidebarOpen, setSidebarOpen] = useState(false); // sidebar state

  const addDiagnosis = () =>
    setDiagnoses([...diagnoses, { code: "", description: "" }]);
  const removeDiagnosis = (idx: number) => {
    if (diagnoses.length === 1) return; // Prevent removing the last row
    setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  };
  const updateDiagnosis = (idx: number, key: string, value: string) => {
    setDiagnoses(
      diagnoses.map((d, i) => (i === idx ? { ...d, [key]: value } : d)),
    );
  };

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      {/* Breadcrumb and Documentation History */}
      <div className="w-[90%] flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-1">
          <Link href="/clients" className="hover:underline">
            Clients and contacts
          </Link>
          <span>/</span>
          <Link href="#" className="hover:underline">
            Jamie D. Appleseed's profile
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">
            Diagnosis and treatment plan
          </span>
        </div>
        <button
          type="button"
          className="text-[#2d8467] hover:underline font-medium"
          onClick={() => setSidebarOpen(true)}
        >
          Documentation history
        </button>
      </div>

      {/* Client Info */}
      <h1 className="text-2xl font-semibold mt-4 mb-1">Jamie D. Appleseed</h1>
      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
        Adult
        <span className="text-gray-300">|</span>
        07/12/2024 (0)
        <span className="text-gray-300">|</span>
        <Link href="#" className="text-[#2d8467] hover:underline">
          Schedule appointment
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="#" className="text-[#2d8467] hover:underline">
          Edit
        </Link>
      </div>

      {!showTreatmentPlan ? (
        <DiagnosisRows
          diagnoses={diagnoses}
          updateDiagnosis={updateDiagnosis}
          addDiagnosis={addDiagnosis}
          removeDiagnosis={removeDiagnosis}
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          renderSkipLink={
            <button
              type="button"
              className="text-[#2d8467] hover:underline"
              onClick={() => setShowTreatmentPlan(true)}
            >
              Skip to treatment plan
            </button>
          }
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
