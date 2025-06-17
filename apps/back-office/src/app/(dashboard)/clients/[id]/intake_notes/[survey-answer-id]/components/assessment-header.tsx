"use client";

import { Button } from "@mcw/ui";
import { Plus, Printer, Download, Trash2 } from "lucide-react";

interface AssessmentHeaderProps {
  isSignable: boolean;
  isSigned: boolean;
  isPending: boolean;
  onSignMeasure: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onDelete: () => void;
}

export function AssessmentHeader({
  isSignable,
  isSigned,
  isPending,
  onSignMeasure,
  onPrint,
  onDownloadPDF,
  onDelete,
}: AssessmentHeaderProps) {
  return (
    <div className="flex items-center gap-3 print:hidden">
      {isSignable && !isSigned && (
        <Button
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
          disabled={isPending}
          size="sm"
          variant="outline"
          onClick={onSignMeasure}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {isPending ? "Signing..." : "Sign Measure"}
        </Button>
      )}
      <Button
        className="text-gray-600"
        size="sm"
        variant="ghost"
        onClick={onPrint}
      >
        <Printer className="h-4 w-4 mr-1.5" />
        Print
      </Button>
      <Button
        className="text-gray-600"
        size="sm"
        variant="ghost"
        onClick={onDownloadPDF}
      >
        <Download className="h-4 w-4 mr-1.5" />
        Download PDF
      </Button>
      <Button
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        size="sm"
        variant="ghost"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Delete Assessment
      </Button>
    </div>
  );
}
