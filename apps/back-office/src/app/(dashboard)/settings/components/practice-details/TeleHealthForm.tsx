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
// import { useState } from "react";
// import TelehealthDialog from "./EditTeleHealth";
// import { PracticeInformation } from "@/types/profile";

// interface TeleHeaalthFormProps {
//   practiceInfoState: PracticeInformation;
//   setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
// }
export default function TeleHeaalthForm() {
  // const [isDialogOpen, setIsDialogOpen] = useState(true);

  return (
    <div className="mt-4">
      <Label className="text-base font-medium">Telehealth</Label>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Your video appointments are conducted through the Telehealth feature.
          You and your clients will get a unique link to access these
          appointments.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Place Of Service</TableHead>
                <TableHead>Public view</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Video Office</TableCell>
                <TableCell className="text-gray-500">
                  No address added
                </TableCell>
                <TableCell>
                  <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                </TableCell>
                <TableCell className="text-sm">
                  02-Telehealth Provided Other than in Patient's Home
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
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      {/* <TelehealthDialog
        isOpen={isDialogOpen}
        practiceInfoState={practiceInfoState}
        setPracticeInfoState={setPracticeInfoState}
        onClose={() => setIsDialogOpen(false)}
      /> */}
    </div>
  );
}
