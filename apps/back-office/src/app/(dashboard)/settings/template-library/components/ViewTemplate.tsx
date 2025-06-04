import React from "react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { Eye } from "lucide-react";
import { SurveyPreview } from "@mcw/ui";
import { Template } from "../hooks/useTemplates";

interface ViewTemplateProps {
  template: Template;
}

export function ViewTemplate({ template }: ViewTemplateProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-gray-100"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4 text-gray-500" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-full h-full w-full flex flex-col items-center p-0 bg-[#e9e9e9] rounded-md shadow-md">
          {/* Header */}
          <div className="flex w-full justify-between bg-white border-b p-6 border-gray-200 pb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">
              {template.name}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.print()}
            >
              🖨️
            </Button>
          </div>

          {/* Survey Preview */}
          <div className="mt-4 p-8 w-[50%] flex-1 overflow-y-auto bg-white rounded-md">
            <SurveyPreview
              content={template.content || ""}
              title={template.name}
              type={template.type}
              mode="edit"
              showInstructions={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
