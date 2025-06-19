import { Button } from "@mcw/ui";

import {
  TableCell,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mcw/ui";

import { TableBody } from "@mcw/ui";

import { Label, TableHead, TableHeader } from "@mcw/ui";

import { Table, TableRow } from "@mcw/ui";
import { Info } from "lucide-react";
import TelehealthDialog from "./EditTeleHealth";
import { useState } from "react";
import { PracticeInformation } from "@/types/profile";
import { useTeleHealthInfo } from "./hooks/usePracticeInformation";

interface TeleHeaalthFormProps {
  practiceInfoState: PracticeInformation;
  setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
}
export default function TeleHealth({
  practiceInfoState,
  setPracticeInfoState,
}: TeleHeaalthFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { teleHealthInfo, isLoading, error } = useTeleHealthInfo();

  return (
    <>
      <div className="mt-4">
        <Label className="text-base font-medium">Telehealth</Label>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your video appointments are conducted through the Telehealth
            feature. You and your clients will get a unique link to access these
            appointments.
          </p>
          {practiceInfoState.tele_health && isLoading && (
            <div className="mt-1">Loading...</div>
          )}

          <div className="overflow-x-auto">
            {practiceInfoState.tele_health && error && (
              <div className="500 mt-1">
                Telehealth information is not available.
              </div>
            )}
            {practiceInfoState.tele_health && teleHealthInfo?.location && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{teleHealthInfo.location?.name}</TableCell>
                    <TableCell className="text-gray-500">
                      {teleHealthInfo.location?.address}
                    </TableCell>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{
                          backgroundColor:
                            teleHealthInfo.location?.color || "#E2E8F0",
                        }}
                      />
                    </TableCell>
                    <TableCell className="flex items-center space-x-1">
                      <span className="text-gray-500">Hidden</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              This location is hidden from public view
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        className="text-blue-500 p-0 h-auto ml-4"
                        variant="link"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <TelehealthDialog
          isOpen={isDialogOpen}
          practiceInfoState={practiceInfoState}
          setPracticeInfoState={setPracticeInfoState}
          onClose={() => setIsDialogOpen(false)}
        />
      </div>
    </>
  );
}
