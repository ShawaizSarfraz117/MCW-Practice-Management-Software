import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";
import { AppointmentData } from "./types";
import { useState } from "react";

interface EditConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (updateOption?: string) => void;
  appointmentData?: AppointmentData;
  status?: string;
}

export function EditConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  appointmentData,
  status,
}: EditConfirmationModalProps) {
  const [selectedOption, setSelectedOption] = useState("this");
  const hasStatusChanged = status && status !== appointmentData?.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        {appointmentData?.type === "event" ? (
          <>
            <DialogHeader>
              <DialogTitle className="tracking-normal text-[22px]">
                Edit event?
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-[15px] text-[#717171]">
              <p>
                {appointmentData?.is_recurring
                  ? "This event is part of a series. What would you like to edit?"
                  : "Are you sure you want to edit this event?"}
              </p>
            </div>
            {appointmentData?.is_recurring ? (
              <>
                <div>
                  <input
                    checked={selectedOption === "this"}
                    className="h-[18px] w-[18px] mr-2 relative top-1"
                    id="one"
                    name="editOption"
                    type="radio"
                    value="this"
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label className="text-[15px] text-[#717171]" htmlFor="one">
                    This event only
                  </label>
                  <p className="ml-6 text-[15px] text-[#717171]">
                    (This will remove the event from the recurring series)
                  </p>
                </div>
                <div>
                  <input
                    checked={selectedOption === "future"}
                    className="h-[18px] w-[18px] mr-2"
                    id="two"
                    name="editOption"
                    type="radio"
                    value="future"
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label className="text-[15px] text-[#717171]" htmlFor="two">
                    This and all future events
                  </label>
                </div>
              </>
            ) : null}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="tracking-normal text-[22px]">
                Edit appointment?
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-[15px] text-[#717171]">
              <p>
                {hasStatusChanged
                  ? "You are about to change the status of this appointment. Do you want to update:"
                  : appointmentData?.is_recurring
                    ? "This appointment is part of a series. What would you like to edit?"
                    : "Are you sure you want to edit this appointment?"}
              </p>
            </div>
            {appointmentData?.is_recurring ? (
              <>
                <div>
                  <input
                    checked={selectedOption === "this"}
                    className="h-[18px] w-[18px] mr-2 relative top-1"
                    id="one"
                    name="editOption"
                    type="radio"
                    value="this"
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label className="text-[15px] text-[#717171]" htmlFor="one">
                    This appointment only
                  </label>
                  <p className="ml-6 text-[15px] text-[#717171]">
                    (This will remove the appointment from the recurring series)
                  </p>
                </div>
                <div>
                  <input
                    checked={selectedOption === "future"}
                    className="h-[18px] w-[18px] mr-2"
                    id="two"
                    name="editOption"
                    type="radio"
                    value="future"
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label className="text-[15px] text-[#717171]" htmlFor="two">
                    This and all future appointments
                  </label>
                </div>
              </>
            ) : null}
          </>
        )}
        <DialogFooter>
          <Button
            className="bg-gray-100 hover:bg-gray-200 hover:text-gray-700 text-gray-500"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#0a96d4] w-[70px] hover:bg-[#0a96d4]/90"
            onClick={() => {
              onConfirm(
                appointmentData?.is_recurring ? selectedOption : undefined,
              );
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
