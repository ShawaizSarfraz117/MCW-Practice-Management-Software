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
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
          <text x="12" y="16" textAnchor="middle" fontSize="14" fill="#9CA3AF">
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
              placeholder="Search"
              value={diag.code}
              onChange={(e) => updateDiagnosis(idx, "code", e.target.value)}
              className="w-full h-10"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <div className="flex items-center">
              <Input
                placeholder="None Selected"
                value={diag.description}
                readOnly
                className="w-full h-10"
              />
              <div className="flex flex-row gap-1 ml-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-6 w-6 text-[#2d8467]"
                  onClick={addDiagnosis}
                  aria-label="Add diagnosis"
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-6 w-6 text-gray-400"
                  onClick={() => removeDiagnosis(idx)}
                  disabled={diagnoses.length === 1}
                  aria-label="Remove diagnosis"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10"
            />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-10"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between gap-2 mt-6 max-w-4xl">
        <Button variant="outline" type="button">
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          {renderSkipLink ? (
            renderSkipLink
          ) : (
            <Link href="#" className="text-[#2d8467] hover:underline">
              Skip to treatment plan
            </Link>
          )}
          <Button variant="secondary" type="button">
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
