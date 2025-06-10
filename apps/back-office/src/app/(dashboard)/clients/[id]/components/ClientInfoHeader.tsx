"use client";

import React from "react";
import Link from "next/link";
import { ClientGroupFromAPI } from "../edit/components/ClientEdit";
import { getClientGroupInfo } from "./ClientProfile";

interface ClientInfoHeaderProps {
  clientInfo: ClientGroupFromAPI | null;
  clientGroupId: string;
  showDocumentationHistory?: boolean;
  onDocumentationHistoryClick?: () => void;
}

export const ClientInfoHeader: React.FC<ClientInfoHeaderProps> = ({
  clientInfo,
  clientGroupId,
  showDocumentationHistory = false,
  onDocumentationHistoryClick,
}) => {
  return (
    <>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {clientInfo ? getClientGroupInfo(clientInfo) : "Loading..."}
          </h1>
          <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
            {clientInfo?.type}
            <span className="text-gray-300">|</span>
            <Link
              className="text-[#2d8467] hover:underline"
              href={`/scheduled?client_id=${clientGroupId}`}
            >
              Schedule appointment
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              className="text-[#2d8467] hover:underline"
              href={`/clients/${clientGroupId}/edit`}
            >
              Edit
            </Link>
          </div>
        </div>

        {showDocumentationHistory && (
          <button
            className="text-[#2d8467] hover:underline font-medium"
            type="button"
            onClick={onDocumentationHistoryClick}
          >
            Documentation history
          </button>
        )}
      </div>
    </>
  );
};
