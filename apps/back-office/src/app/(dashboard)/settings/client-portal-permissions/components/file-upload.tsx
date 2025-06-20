"use client";
import { Card, CardHeader } from "@mcw/ui";
import type { PortalSettings, DeepPartial } from "@mcw/types";

interface FileUploadCardProps {
  settings: PortalSettings | null;
  loading: boolean;
  stageChanges: (updates: DeepPartial<PortalSettings>) => void;
}

export default function FileUploadCard({
  settings,
  loading,
  stageChanges,
}: FileUploadCardProps) {
  const isUploadAllowed =
    settings?.documents?.isUploadDocumentsAllowed ?? false;

  const handleUploadToggle = (enabled: boolean) => {
    stageChanges({
      documents: {
        isUploadDocumentsAllowed: enabled,
      },
    });
  };

  if (loading) {
    return (
      <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-64 mb-1" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold text-[#1F2937] mb-1">
            File Upload
          </div>
          <div className="flex items-center gap-2 mb-1">
            <input
              checked={isUploadAllowed}
              className="accent-[#188153] w-4 h-4"
              id="fileUpload"
              type="checkbox"
              onChange={(e) => handleUploadToggle(e.target.checked)}
            />
            <label
              className="text-base text-[#374151] font-normal"
              htmlFor="fileUpload"
            >
              Allow clients to upload documents to Client Portal
            </label>
          </div>
          <a className="text-[#2563EB] text-sm hover:underline ml-7" href="#">
            Learn about setting up your Client Portal
          </a>
        </div>
      </CardHeader>
    </Card>
  );
}
