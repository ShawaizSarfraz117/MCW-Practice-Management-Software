import React from "react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { Eye } from "lucide-react";

interface ViewTemplateProps {
  title: string;
  type: string;
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

export function ViewTemplate({ title }: ViewTemplateProps) {
  const [open, setOpen] = React.useState(false);

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
            <h2 className="text-xl font-semibold  text-gray-900">
              {title.split(" (")[0]}
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

          {/* Instructions */}
          <div className="mt-4 p-8 w-[50%] flex-1 gap-4 overflow-y-auto bg-white rounded-md">
            <div className="py-4">
              <p className="text-xs text-gray-500 mt-1 text-right">
                <span className="text-red-500">*</span> indicates a required
                field
              </p>
              <p className="text-sm text-gray-800 italic">
                Thinking about{" "}
                <strong>today's or the most recent meeting</strong>, please
                indicate how strongly you agree or disagree with each statement.
              </p>
            </div>

            {/* Questions */}
            {content.sections.map((section, sIdx) => (
              <div key={sIdx}>
                <p className="text-sm text-gray-900 font-medium">
                  {section.title}
                </p>

                {section.questions.map((question, qIdx) => (
                  <div
                    key={qIdx}
                    className="space-y-3 border-b border-gray-200 pb-6"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-red-500">*</span> {qIdx + 1}.{" "}
                      {question}
                    </p>

                    {content.options && (
                      <div className="space-y-2 pl-4">
                        {content.options.map((option, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`question-${qIdx}-option-${oIdx}`}
                              name={`question-${qIdx}`}
                              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
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
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
