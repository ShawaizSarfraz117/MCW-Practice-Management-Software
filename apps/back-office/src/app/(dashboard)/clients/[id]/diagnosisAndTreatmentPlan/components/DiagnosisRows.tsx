"use client";
import React from "react";
import { Button, Input } from "@mcw/ui";
import Link from "next/link";

type Diagnosis = { code: string; description: string };

interface DiagnosisRowsProps {
  diagnoses: Diagnosis[];
  updateDiagnosis: (idx: number, key: string, value: string) => void;
  addDiagnosis: () => void;
  removeDiagnosis: (idx: number) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  renderSkipLink?: React.ReactNode;
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
}) => (
  <div className="mt-6">
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-lg font-semibold text-gray-900">Diagnosis</h2>
      <span className="text-gray-400 cursor-pointer" title="Diagnosis info">
        <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
          <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
          <text fill="#9CA3AF" fontSize="14" textAnchor="middle" x="12" y="16">
            ?
          </text>
        </svg>
      </span>
    </div>
    <div className="text-gray-600 mb-4">
      Select a diagnosis code to get started.
    </div>
    <form className="space-y-4">
      {diagnoses.map((diag, idx) => (
        <div
          key={idx}
          className="flex md:flex-col flex-row md:items-center gap-2 mb-2 max-w-4xl"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis code
            </label>
            <Input
              className="w-full h-10"
              placeholder="Search"
              value={diag.code}
              onChange={(e) => updateDiagnosis(idx, "code", e.target.value)}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <div className="flex items-center">
              <Input
                readOnly
                className="w-full h-10"
                placeholder="None Selected"
                value={diag.description}
              />
              <div className="flex flex-row gap-1 ml-2">
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
            type="submit"
          >
            Save
          </Button>
        </div>
      </div>
    </form>
  </div>
);

export default DiagnosisRows;
