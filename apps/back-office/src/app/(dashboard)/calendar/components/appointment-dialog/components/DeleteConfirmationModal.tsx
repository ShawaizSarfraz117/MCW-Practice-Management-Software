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
                This event is part of a series. What would you like to delete?
              </p>
            </div>
            <div>
              <input
                id="single"
                type="radio"
                name="deleteOption"
                checked={selectedOption === "single"}
                onChange={() => onOptionChange("single")}
                className="h-[18px] w-[18px] mr-2 relative top-1"
              />
              <label htmlFor="single" className="text-[15px] text-[#717171]">
                This event only
              </label>
            </div>
            <div>
              <input
                id="future"
                type="radio"
                name="deleteOption"
                checked={selectedOption === "future"}
                onChange={() => onOptionChange("future")}
                className="h-[18px] w-[18px] mr-2"
              />
              <label htmlFor="future" className="text-[15px] text-[#717171]">
                This and all future events
              </label>
            </div>
            <div>
              <input
                id="all"
                type="radio"
                name="deleteOption"
                checked={selectedOption === "all"}
                onChange={() => onOptionChange("all")}
                className="h-[18px] w-[18px] mr-2"
              />
              <label htmlFor="all" className="text-[15px] text-[#717171]">
                All of the series, including past events
              </label>
            </div>
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
                This appointment is part of a series. What would you like to
                delete?
              </p>
            </div>
            <div>
              <input
                id="single"
                type="radio"
                name="deleteOption"
                checked={selectedOption === "single"}
                onChange={() => onOptionChange("single")}
                className="h-[18px] w-[18px] mr-2 relative top-1"
              />
              <label htmlFor="single" className="text-[15px] text-[#717171]">
                This appointment only
              </label>
            </div>
            <div>
              <input
                id="future"
                type="radio"
                name="deleteOption"
                checked={selectedOption === "future"}
                onChange={() => onOptionChange("future")}
                className="h-[18px] w-[18px] mr-2"
              />
              <label htmlFor="future" className="text-[15px] text-[#717171]">
                This and all future appointments
              </label>
            </div>
            <div>
              <input
                id="all"
                type="radio"
                name="deleteOption"
                checked={selectedOption === "all"}
                onChange={() => onOptionChange("all")}
                className="h-[18px] w-[18px] mr-2"
              />
              <label htmlFor="all" className="text-[15px] text-[#717171]">
                All of the series, including past appointments
              </label>
            </div>
          </>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            className="bg-gray-100 hover:bg-gray-200 hover:text-gray-700 text-gray-500"
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
