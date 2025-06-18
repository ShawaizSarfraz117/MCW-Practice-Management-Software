"use client";
import React, { useState, useEffect } from "react";
import { Button, Input } from "@mcw/ui";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@mcw/ui";
import { fetchDiagnosis } from "@/(dashboard)/clients/services/client.service";

type Diagnosis = { code: string; description: string; id?: string };
type DiagnosisOption = { id: string; code: string; description: string };

interface DiagnosisRowsProps {
  diagnoses: Diagnosis[];
  updateDiagnosis: (idx: number, updates: Partial<Diagnosis>) => void;
  addDiagnosis: () => void;
  removeDiagnosis: (idx: number) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  renderSkipLink?: React.ReactNode;
  onSave?: () => void;
}

const DiagnosisRows: React.FC<DiagnosisRowsProps> = ({
  diagnoses,
  updateDiagnosis,
  addDiagnosis,
  removeDiagnosis,
  date,
  setDate,
  time,
  setTime,
  renderSkipLink,
  onSave,
}) => {
  const [diagnosisOptions, setDiagnosisOptions] = useState<DiagnosisOption[]>(
    [],
  );
  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const loadDiagnoses = async () => {
      const [data, error] = await fetchDiagnosis();
      if (!error && data) {
        const diagnosisArray = Array.isArray(data) ? data : [];
        setDiagnosisOptions(diagnosisArray as DiagnosisOption[]);
      }
    };
    loadDiagnoses();
  }, []);

  const handleDiagnosisSelect = (idx: number, diagnosis: DiagnosisOption) => {
    // Update all fields at once
    updateDiagnosis(idx, {
      code: diagnosis.code,
      description: diagnosis.description,
      id: diagnosis.id,
    });
    // Close popover and clear search
    setOpenPopovers((prev) => ({ ...prev, [idx]: false }));
    setSearchTerms((prev) => ({ ...prev, [idx]: "" }));
  };

  const filteredOptions = (idx: number) => {
    const term = searchTerms[idx] || "";
    if (!term) return diagnosisOptions.slice(0, 10);

    return diagnosisOptions
      .filter(
        (option) =>
          option.code.toLowerCase().includes(term.toLowerCase()) ||
          option.description.toLowerCase().includes(term.toLowerCase()),
      )
      .slice(0, 20);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Diagnosis</h2>
        <span className="text-gray-400 cursor-pointer" title="Diagnosis info">
          <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
            <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
            <text
              fill="#9CA3AF"
              fontSize="14"
              textAnchor="middle"
              x="12"
              y="16"
            >
              ?
            </text>
          </svg>
        </span>
      </div>
      <div className="text-gray-600 mb-4">
        Select a diagnosis code to get started.
      </div>

      {/* Table header */}
      <div className="flex gap-2 mb-2 max-w-4xl">
        <div className="w-48">
          <span className="text-sm font-medium text-gray-700">
            Diagnosis code
          </span>
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-700">Description</span>
        </div>
        <div className="w-20" />
      </div>

      <form className="space-y-2">
        {diagnoses.map((diag, idx) => (
          <div
            key={`diagnosis-${idx}-${diag.code || "empty"}`}
            className="flex gap-2 items-start"
          >
            <div className="w-48">
              <Popover
                open={openPopovers[idx] || false}
                onOpenChange={(open) =>
                  setOpenPopovers((prev) => ({ ...prev, [idx]: open }))
                }
              >
                <PopoverTrigger asChild>
                  <button
                    className="w-full h-10 px-3 text-left border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2d8467] flex items-center justify-between"
                    type="button"
                  >
                    <span
                      className={diag.code ? "text-gray-900" : "text-gray-400"}
                    >
                      {diag.code || "Search"}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[400px] p-0">
                  <div className="flex flex-col">
                    <div className="px-3 py-2 border-b">
                      <input
                        autoFocus
                        className="w-full px-2 py-1 text-sm outline-none"
                        placeholder="Type here to search through 1000's of ICD-10 codes"
                        type="text"
                        value={searchTerms[idx] || ""}
                        onChange={(e) => {
                          setSearchTerms((prev) => ({
                            ...prev,
                            [idx]: e.target.value,
                          }));
                        }}
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredOptions(idx).length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No diagnosis found.
                        </div>
                      ) : (
                        filteredOptions(idx).map((option) => (
                          <button
                            key={option.id}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            type="button"
                            onClick={() => {
                              handleDiagnosisSelect(idx, option);
                            }}
                          >
                            <div className="flex items-center">
                              <span className="font-medium">{option.code}</span>
                              <span className="ml-2 text-gray-600 truncate">
                                - {option.description}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <Input
                className="w-full h-10"
                placeholder="None Selected"
                value={diag.description || ""}
                onChange={(e) =>
                  updateDiagnosis(idx, { description: e.target.value })
                }
              />
            </div>
            <div className="flex gap-1 items-center pt-1">
              <Button
                aria-label="Add diagnosis"
                className="p-0 h-6 w-6 text-[#2d8467]"
                type="button"
                variant="ghost"
                onClick={addDiagnosis}
              >
                +
              </Button>
              <Button
                aria-label="Remove diagnosis"
                className="p-0 h-6 w-6 text-gray-400"
                disabled={diagnoses.length === 1}
                type="button"
                variant="ghost"
                onClick={() => removeDiagnosis(idx)}
              >
                <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                  <path
                    d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </Button>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date and time of diagnosis
            </label>
            <div className="flex gap-2">
              <Input
                className="w-full h-10"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Input
                className="w-full h-10"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2 mt-6 max-w-4xl">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {renderSkipLink ? (
              renderSkipLink
            ) : (
              <Link className="text-[#2d8467] hover:underline" href="#">
                Skip to treatment plan
              </Link>
            )}
            <Button type="button" variant="secondary">
              Load last plan
            </Button>
            <Button
              className="bg-[#2d8467] hover:bg-[#236c53] text-white"
              type="button"
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DiagnosisRows;
