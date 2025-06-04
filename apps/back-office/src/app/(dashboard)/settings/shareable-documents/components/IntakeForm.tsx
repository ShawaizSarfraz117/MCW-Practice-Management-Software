import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Dialog,
  DialogContent,
} from "@mcw/ui";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShareableTemplate } from "../hooks/useShareableTemplates";
import { SurveyPreview } from "@mcw/ui";

// Types
interface BaseForm {
  id?: string;
  name: string;
  default: boolean;
  content?: string;
}

interface IntakeFormProps {
  intakeForms: ShareableTemplate[];
  scoredMeasures: ShareableTemplate[];
}

export function IntakeForm({ intakeForms, scoredMeasures }: IntakeFormProps) {
  const router = useRouter();
  const [viewingIntake, setViewingIntake] = useState<BaseForm | null>(null);
  const [viewingMeasure, setViewingMeasure] = useState<BaseForm | null>(null);

  return (
    <div className="space-y-8">
      {/* Uploaded Files */}
      <div className="space-y-4">
        <div className="bg-white p-4 border rounded-md">
          <h2 className="text-base font-semibold text-gray-900">
            Uploaded files
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage PDF and image files to share with clients, like homework,
            handouts, and articles
          </p>
          <button className="mt-4 inline-flex items-center text-[#2d8467] hover:text-[#236c53]">
            <Plus className="h-4 w-4 mr-1" />
            <span>Downloadable File</span>
          </button>
        </div>
      </div>

      {/* Scored Measures */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Scored measures
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Track client-reported symptoms and outcomes with validated
            measurement tools
          </p>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Name</TableHead>
                <TableHead className="w-[100px]">Default</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoredMeasures.map((measure) => (
                <TableRow key={measure.id}>
                  <TableCell className="font-medium">{measure.name}</TableCell>
                  <TableCell>
                    <div className="pl-4">
                      <span className="text-sm text-gray-600">
                        {measure.is_default ? "Yes" : "No"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Button
                        className="h-8 w-8 hover:bg-gray-100"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setViewingMeasure({
                            id: measure.id,
                            name: measure.name,
                            default: measure.is_default,
                            content: measure.content,
                          })
                        }
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Intake Forms */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Intake Forms
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage intake questionnaires and forms
          </p>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Name</TableHead>
                <TableHead className="w-[100px]">Default</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intakeForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>
                    <div className="pl-4">
                      <span className="text-sm text-gray-600">
                        {form.is_default ? "Yes" : "No"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Button
                        className="h-8 w-8 hover:bg-gray-100"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setViewingIntake({
                            id: form.id,
                            name: form.name,
                            default: form.is_default,
                            content: form.content,
                          })
                        }
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button
          className="border text-green-700"
          variant="outline"
          onClick={() => router.push("/settings/template-library")}
        >
          <span>Manage Forms</span>
        </Button>
      </div>

      {/* Demographics and Credit Card Forms */}
      <div className="space-y-4 bg-white p-6 rounded-lg border">
        <h2 className="text-base font-semibold text-gray-900">
          Demographics and Credit Card Forms
        </h2>
        <p className="text-sm text-gray-600">
          Select which items you'd like to include on your demographics form,
          and if you want to include a credit card form.{" "}
          <a className="text-blue-600 hover:text-blue-800" href="#">
            Learn more
          </a>
        </p>

        <div className="rounded-md border">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Demographics form</TableCell>
                <TableCell>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        className="h-4 w-4 rounded border-gray-300"
                        type="checkbox"
                      />
                      <span className="text-sm text-gray-600">
                        Name they go by
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        className="h-4 w-4 rounded border-gray-300"
                        type="checkbox"
                      />
                      <span className="text-sm text-gray-600">Insurance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        className="h-4 w-4 rounded border-gray-300"
                        type="checkbox"
                      />
                      <span className="text-sm text-gray-600">
                        Gender identity
                      </span>
                    </label>
                  </div>
                </TableCell>
                <TableCell className="w-[100px]">
                  <Button className="h-8 w-8" size="icon" variant="ghost">
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Credit card information
                </TableCell>
                <TableCell colSpan={2}>
                  <a
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    href="#"
                  >
                    Enable Online Payments to accept credit cards
                  </a>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Measure Modal */}
      <Dialog
        open={!!viewingMeasure}
        onOpenChange={() => setViewingMeasure(null)}
      >
        <DialogContent className="max-w-full h-full w-full flex flex-col items-center p-0 bg-[#e9e9e9] rounded-md shadow-md">
          {viewingMeasure && (
            <>
              {/* Header */}
              <div className="flex w-full justify-between bg-white border-b p-6 border-gray-200 pb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {viewingMeasure.name}
                </h2>
                <Button
                  className="h-8 w-8"
                  size="icon"
                  variant="ghost"
                  onClick={() => window.print()}
                >
                  🖨️
                </Button>
              </div>

              {/* Survey Preview */}
              <div className="mt-4 p-8 w-[50%] flex-1 overflow-y-auto bg-white rounded-md">
                {viewingMeasure.content ? (
                  <SurveyPreview
                    content={viewingMeasure.content}
                    mode="edit"
                    showInstructions={true}
                    title={viewingMeasure.name}
                    type="SCORED_MEASURES"
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    No preview available for this template.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Intake Form Dialog */}
      <Dialog
        open={!!viewingIntake}
        onOpenChange={() => setViewingIntake(null)}
      >
        <DialogContent className="max-w-full h-full w-full flex flex-col items-center p-0 bg-[#e9e9e9] rounded-md shadow-md">
          {viewingIntake && (
            <>
              {/* Header */}
              <div className="flex w-full justify-between bg-white border-b p-6 border-gray-200 pb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {viewingIntake.name}
                </h2>
                <Button
                  className="h-8 w-8"
                  size="icon"
                  variant="ghost"
                  onClick={() => window.print()}
                >
                  🖨️
                </Button>
              </div>

              {/* Survey Preview */}
              <div className="mt-4 p-8 w-[50%] flex-1 overflow-y-auto bg-white rounded-md">
                {viewingIntake.content ? (
                  <SurveyPreview
                    content={viewingIntake.content}
                    mode="edit"
                    showInstructions={true}
                    title={viewingIntake.name}
                    type="INTAKE_FORMS"
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    No preview available for this template.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
