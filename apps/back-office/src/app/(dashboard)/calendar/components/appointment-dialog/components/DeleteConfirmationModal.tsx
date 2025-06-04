import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";
import { AppointmentData } from "../types";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedOption: "single" | "future" | "all";
  onOptionChange: (option: "single" | "future" | "all") => void;
  appointmentData?: AppointmentData;
}

export function DeleteConfirmationModal({
  open,
  onConfirm,
  onOpenChange,
  selectedOption,
  onOptionChange,
  appointmentData,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        {appointmentData?.type === "event" ? (
          <>
            <DialogHeader>
              <DialogTitle className="tracking-normal text-[22px]">
                Delete event?
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-[15px] text-[#717171]">
              <p>
                {appointmentData?.is_recurring
                  ? "This event is part of a series. What would you like to delete?"
                  : "Are you sure you want to delete this event?"}
              </p>
            </div>
            {appointmentData?.is_recurring ? (
              <>
                <div>
                  <input
                    checked={selectedOption === "single"}
                    className="h-[18px] w-[18px] mr-2 relative top-1"
                    id="single"
                    name="deleteOption"
                    type="radio"
                    onChange={() => onOptionChange("single")}
                  />
                  <label
                    className="text-[15px] text-[#717171]"
                    htmlFor="single"
                  >
                    This event only
                  </label>
                </div>
                <div>
                  <input
                    checked={selectedOption === "future"}
                    className="h-[18px] w-[18px] mr-2"
                    id="future"
                    name="deleteOption"
                    type="radio"
                    onChange={() => onOptionChange("future")}
                  />
                  <label
                    className="text-[15px] text-[#717171]"
                    htmlFor="future"
                  >
                    This and all future events
                  </label>
                </div>
                <div>
                  <input
                    checked={selectedOption === "all"}
                    className="h-[18px] w-[18px] mr-2"
                    id="all"
                    name="deleteOption"
                    type="radio"
                    onChange={() => onOptionChange("all")}
                  />
                  <label className="text-[15px] text-[#717171]" htmlFor="all">
                    All of the series, including past events
                  </label>
                </div>
              </>
            ) : null}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="tracking-normal text-[22px]">
                Delete appointment?
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-[15px] text-[#717171]">
              <p>
                {appointmentData?.is_recurring
                  ? "This appointment is part of a series. What would you like to delete?"
                  : "Are you sure you want to delete this appointment?"}
              </p>
            </div>
            {appointmentData?.is_recurring ? (
              <>
                <div>
                  <input
                    checked={selectedOption === "single"}
                    className="h-[18px] w-[18px] mr-2 relative top-1"
                    id="single"
                    name="deleteOption"
                    type="radio"
                    onChange={() => onOptionChange("single")}
                  />
                  <label
                    className="text-[15px] text-[#717171]"
                    htmlFor="single"
                  >
                    This appointment only
                  </label>
                </div>
                <div>
                  <input
                    checked={selectedOption === "future"}
                    className="h-[18px] w-[18px] mr-2"
                    id="future"
                    name="deleteOption"
                    type="radio"
                    onChange={() => onOptionChange("future")}
                  />
                  <label
                    className="text-[15px] text-[#717171]"
                    htmlFor="future"
                  >
                    This and all future appointments
                  </label>
                </div>
                <div>
                  <input
                    checked={selectedOption === "all"}
                    className="h-[18px] w-[18px] mr-2"
                    id="all"
                    name="deleteOption"
                    type="radio"
                    onChange={() => onOptionChange("all")}
                  />
                  <label className="text-[15px] text-[#717171]" htmlFor="all">
                    All of the series, including past appointments
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
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
