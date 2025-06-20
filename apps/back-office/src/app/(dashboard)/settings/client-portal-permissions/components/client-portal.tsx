"use client";
import {
  Switch,
  Input,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mcw/ui";
import { useState, useEffect } from "react";

// Domain Input Component
function DomainInput({
  editing,
  subdomain,
  setSubdomain,
  onSave,
  onCancel,
  onEdit,
}: {
  editing: boolean;
  subdomain: string;
  setSubdomain: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}) {
  const currentDomain = subdomain || "your-subdomain";

  return (
    <div className="w-full max-w-xl h-10 flex items-center gap-2 mt-2">
      {editing ? (
        <>
          <span className="text-[#BDBDBD] text-base font-medium bg-[#F5F5F5] border border-[#E5E7EB] rounded-l-md px-3 h-10 flex items-center select-none">
            https://
          </span>
          <Input
            autoFocus
            className="w-full h-10 text-base font-medium border-t border-b border-[#E5E7EB] rounded-none focus-visible:ring-0 bg-white min-w-0"
            style={{ borderLeft: "none", borderRight: "none" }}
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
          />
          <span className="text-[#BDBDBD] text-base font-medium bg-[#F5F5F5] border border-[#E5E7EB] rounded-r-md px-3 h-10 flex items-center select-none">
            .clientsecure.me
          </span>
          <Button
            className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-5 ml-2"
            size="sm"
            onClick={onSave}
          >
            Save
          </Button>
          <Button
            className="ml-1"
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Input
            readOnly
            className="w-full h-10 text-base font-medium bg-white border border-[#E5E7EB] focus-visible:ring-0 focus-visible:border-[#2D8467] rounded-md"
            value={`https://${currentDomain}.clientsecure.me`}
          />
          <Button
            className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-5"
            size="sm"
            onClick={onEdit}
          >
            Edit
          </Button>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] ml-1">
            <svg
              className="h-5 w-5 text-[#9CA3AF]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect height="13" rx="2" strokeWidth="2" width="13" x="9" y="9" />
              <rect height="13" rx="2" strokeWidth="2" width="13" x="3" y="3" />
            </svg>
          </span>
        </>
      )}
    </div>
  );
}

// Portal Enabled Info Component
function PortalEnabledInfo() {
  return (
    <div className="bg-[#F1F7FE] border border-[#D1E7FB] rounded-lg p-4 flex items-start gap-3 mt-4 relative">
      <div>
        <div className="font-semibold text-[#1F2937] mb-1">
          Your Client Portal is enabled
        </div>
        <div className="text-[#4B5563] text-sm leading-relaxed">
          Your Client Portal is a place where people can find you online and for
          you to communicate securely with clients. Play around with the Client
          Portal and customize it to make it your own.
          <a className="text-[#2563EB] ml-1 hover:underline" href="#">
            Learn more
          </a>
        </div>
      </div>
      <button className="absolute top-3 right-3 text-[#6B7280] hover:text-[#111827]">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 18L18 6M6 6l12 12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    </div>
  );
}

interface ClientPortalCardProps {
  settings: {
    general?: {
      isEnabled?: boolean;
      domainUrl?: string | null;
    };
  } | null;
  loading: boolean;
  stageChanges: (updates: {
    general?: {
      isEnabled?: boolean;
      domainUrl?: string;
    };
  }) => void;
}

export default function ClientPortalCard({
  settings,
  loading,
  stageChanges,
}: ClientPortalCardProps) {
  const [editing, setEditing] = useState(false);
  const [subdomain, setSubdomain] = useState("");

  useEffect(() => {
    if (settings?.general?.domainUrl) {
      const extractedSubdomain = settings.general.domainUrl
        .replace("https://", "")
        .replace(".clientsecure.me", "");
      setSubdomain(extractedSubdomain);
    }
  }, [settings]);

  const handlePortalToggle = (enabled: boolean) => {
    stageChanges({
      general: {
        isEnabled: enabled,
      },
    });
  };

  const handleSubdomainSave = () => {
    const domainUrl = `https://${subdomain}.clientsecure.me`;
    stageChanges({
      general: {
        domainUrl: domainUrl,
      },
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    if (settings?.general?.domainUrl) {
      const extractedSubdomain = settings.general.domainUrl
        .replace("https://", "")
        .replace(".clientsecure.me", "");
      setSubdomain(extractedSubdomain);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
        <CardHeader className="pb-0">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-96 mb-2" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  const isEnabled = settings?.general?.isEnabled ?? false;

  return (
    <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-[#1F2937] mb-1">
              Client Portal
            </CardTitle>
            <div className="text-sm text-[#6B7280] font-medium mb-1">
              Default domain
            </div>
            <div className="text-sm text-[#6B7280] mb-2">
              This is the default domain of your Website and Client Portal.{" "}
              <a className="text-[#2563EB] hover:underline" href="#">
                Learn more
              </a>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            className="mt-1 scale-125 data-[state=checked]:bg-[#188153]"
            onCheckedChange={handlePortalToggle}
          />
        </div>
        <DomainInput
          editing={editing}
          setSubdomain={setSubdomain}
          subdomain={subdomain}
          onCancel={handleCancel}
          onEdit={() => setEditing(true)}
          onSave={handleSubdomainSave}
        />
        {editing && (
          <div className="flex items-center gap-2 mt-2 ml-1">
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              This URL is available
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>{isEnabled && <PortalEnabledInfo />}</CardContent>
    </Card>
  );
}
