"use client";

import React from "react";
import { Button, Badge } from "@mcw/ui";
import { Copy } from "lucide-react";
import { ViewTemplate } from "./ViewTemplate";
import { DeleteTemplateDialog } from "./DeleteTemplateDialog";
import { Template } from "../hooks/useTemplates";

interface TemplateSectionProps {
  title: string;
  description: string;
  templates: Template[];
  showBadge?: boolean;
  showIntakeLink?: boolean;
  onDuplicateTemplate: (template: Template) => void;
  onShareableChange: (template: Template, checked: boolean) => void;
}

export function TemplateSection({
  title,
  description,
  templates,
  showBadge = false,
  showIntakeLink = false,
  onDuplicateTemplate,
  onShareableChange,
}: TemplateSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {showBadge && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 hover:bg-orange-100"
            >
              New
            </Badge>
          )}
        </div>
        {showIntakeLink ? (
          <p className="mt-1 text-sm text-gray-600">
            {description}{" "}
            <a
              href="/settings/shareable-documents"
              className="text-blue-600 hover:text-blue-800"
            >
              Shareable documents
            </a>
          </p>
        ) : (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>

      {templates.length > 0 && (
        <div className="space-y-2">
          {templates.map((template: Template) => (
            <div
              key={template.id}
              className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  checked={template.is_shareable}
                  onChange={(e) =>
                    onShareableChange(template, e.target.checked)
                  }
                  disabled={template.is_default}
                />
                <span className="text-sm font-medium text-gray-900">
                  {template.name}
                  {template.is_default && " (Default)"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ViewTemplate template={template} />
                {template.type !== "SCORED_MEASURES" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-100"
                    onClick={() => onDuplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
                {!template.is_default && (
                  <DeleteTemplateDialog
                    id={template.id}
                    title={template.name}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
