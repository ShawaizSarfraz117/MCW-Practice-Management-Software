import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Sheet,
  SheetContent,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";

// Types
interface BaseForm {
  name: string;
  default: boolean;
  content?: string;
}

// Mock Data
const MOCK_DATA = {
  intakeForms: [
    { name: "COVID-19 Pre-Appointment Screening Questionnaire", default: true },
    { name: "Standard Intake Questionnaire Template", default: true },
    { name: "Release of Information", default: true },
    { name: "Consent for Minor Usage of Software Services", default: true },
    { name: "Third Party Financial Responsibility Form", default: true },
  ],
  scoredMeasures: [
    { name: "GAD-7", default: true },
    { name: "PHQ-9", default: true },
  ],
  uploadedFiles: [
    { name: "Authorization for Release of Information", type: "pdf" },
    { name: "BAI", type: "pdf" },
    { name: "BDI", type: "pdf" },
  ],
};

export function IntakeForm() {
  const [viewingIntake, setViewingIntake] = useState<BaseForm | null>(null);
  const [editingIntake, setEditingIntake] = useState<BaseForm | null>(null);
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
              {MOCK_DATA.scoredMeasures.map((measure) => (
                <TableRow key={measure.name}>
                  <TableCell className="font-medium">{measure.name}</TableCell>
                  <TableCell>
                    <div className="pl-4">
                      <span className="text-sm text-gray-600">
                        {measure.default ? "Yes" : "No"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => setViewingMeasure(measure)}
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
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.intakeForms.map((form) => (
                <TableRow key={form.name}>
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>
                    <div className="pl-4">
                      <span className="text-sm text-gray-600">
                        {form.default ? "Yes" : "No"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Edit
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button className="border text-green-700" variant="outline">
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
          <a href="#" className="text-blue-600 hover:text-blue-800">
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
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">
                        Name they go by
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">Insurance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">
                        Gender identity
                      </span>
                    </label>
                  </div>
                </TableCell>
                <TableCell className="w-[100px]">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    href="#"
                    className="text-blue-600 hover:text-blue-800 text-sm"
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
        <DialogContent className="max-w-2xl">
          {viewingMeasure && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingMeasure.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Preview of the scored measure form will be displayed here.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View/Edit Intake Form Sheet */}
      <Sheet
        open={!!viewingIntake || !!editingIntake}
        onOpenChange={() => {
          setViewingIntake(null);
          setEditingIntake(null);
        }}
      >
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-medium">
                {editingIntake ? "Edit Intake Form" : "View Intake Form"}
              </h2>
              {editingIntake && (
                <Button className="bg-[#2d8467] hover:bg-[#236c53]">
                  Save Changes
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-auto py-4">
              <p className="text-sm text-gray-600">
                {editingIntake
                  ? "Edit form content here"
                  : "Form preview content"}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
