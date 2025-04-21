import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";
import { AppointmentData } from "./types";

interface EditConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  appointmentData?: AppointmentData;
}

export function EditConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  appointmentData,
}: EditConfirmationModalProps) {
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
                This event is part of a series. What would you like to edit ?
              </p>
            </div>
            <div>
              <input
                id="one"
                type="radio"
                name="1"
                className="h-[18px] w-[18px] mr-2 relative top-1"
              />
              <label htmlFor="one" className="text-[15px] text-[#717171]">
                This event only
              </label>
              <p className="ml-6 text-[15px] text-[#717171]">
                (This will remove the event from the recurring series)
              </p>
            </div>
            <div>
              <input
                id="two"
                type="radio"
                name="1"
                className="h-[18px] w-[18px] mr-2"
              />
              <label htmlFor="two" className="text-[15px] text-[#717171]">
                This and all future events
              </label>
            </div>
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
                This appointment is part of a series. What would you like to
                edit ?
              </p>
            </div>
            <div>
              <input
                id="one"
                type="radio"
                name="1"
                className="h-[18px] w-[18px] mr-2 relative top-1"
              />
              <label htmlFor="one" className="text-[15px] text-[#717171]">
                This appointment only
              </label>
              <p className="ml-6 text-[15px] text-[#717171]">
                (This will remove the appointment from the recurring series)
              </p>
            </div>
            <div>
              <input
                id="two"
                type="radio"
                name="1"
                className="h-[18px] w-[18px] mr-2"
              />
              <label htmlFor="two" className="text-[15px] text-[#717171]">
                This and all future appointments
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
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
