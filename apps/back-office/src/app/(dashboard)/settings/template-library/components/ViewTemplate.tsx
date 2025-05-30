import React, { useRef } from "react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { Eye, X, ChevronDown, Printer, Download } from "lucide-react";
import { useTemplate } from "../hooks/useTemplates";
import { TemplateType } from "@/types/templateTypes";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";

export interface ViewTemplateProps {
  id?: string;
  title: string;
  type?: TemplateType;
}

interface TemplateSection {
  title: string;
  questions: string[];
}

interface TemplateContent {
  sections: TemplateSection[];
  options?: string[];
}

interface TemplateData {
  [key: string]: TemplateContent;
}

export function ViewTemplate({ id, title }: ViewTemplateProps) {
  const [open, setOpen] = React.useState(false);
  const templateContentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useTemplate(id || "");
  const templateData = data?.data;

  const templateContent: TemplateData = {
    "GAD-7 (Generalized Anxiety Disorder)": {
      sections: [
        {
          title:
            "Over the last 2 weeks, how often have you been bothered by the following problems?",
          questions: [
            "Feeling nervous, anxious, or on edge.",
            "Not being able to stop or control worrying.",
            "Worrying too much about different things.",
            "Trouble relaxing.",
          ],
        },
      ],
      options: [
        "Not at all",
        "Several days",
        "Over half the days",
        "Nearly every day",
      ],
    },
  };

  const content = templateContent[title] || {
    sections: [
      {
        title: "Template Preview",
        questions: ["This is a placeholder preview for the template content."],
      },
    ],
  };

  const handlePrint = () => {
    if (templateContentRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${templateData?.name || title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .question { margin-bottom: 15px; }
                .options { margin-left: 25px; }
              </style>
            </head>
            <body>
              <h1>${templateData?.name || title}</h1>
              ${templateContentRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    // Placeholder for PDF download functionality
    alert("Download functionality would be implemented here");
  };

  const renderTemplateContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center w-full h-48">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading template content...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8 flex justify-center items-center">
          <p className="text-red-500">
            Error loading template: {error.message}
          </p>
        </div>
      );
    }

    if (templateData?.content) {
      try {
        const parsedContent = JSON.parse(templateData.content);

        if (parsedContent) {
          return (
            <div className="bg-white rounded-lg shadow-md h-max max-h-fit max-w-4xl w-full p-8">
              <pre className="text-xs overflow-auto p-4 bg-gray-50 rounded border">
                {JSON.stringify(parsedContent, null, 2)}
              </pre>
            </div>
          );
        }
      } catch (e) {
        console.error("Failed to parse template content:", e);
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-md h-max max-h-fit max-w-4xl w-full p-8">
        <div className="flex justify-between items-start mb-8 header-section">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Template Type</p>
              <p className="font-medium">
                {templateData?.type || "Standard Template"}
              </p>
            </div>
            <div>
              <p className="font-medium">{templateData?.name || title}</p>
            </div>
          </div>
          <div className="w-24 h-24 bg-[#d9d9d9] rounded-full flex items-center justify-center logo-container">
            <span className="text-sm text-gray-600">LOGO</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4 text-right">
          <span className="text-red-500">*</span> Indicates a required field
        </p>

        {content.sections.map((section: TemplateSection, sIdx: number) => (
          <div key={sIdx} className="space-y-6 mb-8">
            <p className="text-base font-medium text-gray-900">
              {section.title}
            </p>
            <div className="space-y-8">
              {section.questions.map((question: string, qIdx: number) => (
                <div
                  key={qIdx}
                  className="space-y-3 border-b border-gray-100 pb-4"
                >
                  <p className="text-sm text-gray-900">
                    <span className="text-red-500">*</span> {qIdx + 1}.{" "}
                    {question}
                  </p>
                  {content.options && (
                    <div className="space-y-2 pl-6">
                      {content.options.map((option: string, oIdx: number) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`question-${qIdx}-option-${oIdx}`}
                            name={`question-${qIdx}`}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            disabled
                          />
                          <label
                            htmlFor={`question-${qIdx}-option-${oIdx}`}
                            className="text-sm text-gray-700"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-gray-100"
        onClick={() => setOpen(true)}
        data-testid="eye-icon"
      >
        <Eye className="h-4 w-4 text-gray-500" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-full h-screen flex flex-col p-0 m-0 rounded-none border-0 [&>button]:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center">
              <button className="mr-4" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <h1 className="text-xl font-medium">
                {templateData?.name || title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-1" variant="outline">
                    More
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Template Content */}
          <div className="flex-1 bg-[#f9fafb] p-6 overflow-auto flex justify-center">
            <div ref={templateContentRef}>{renderTemplateContent()}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
