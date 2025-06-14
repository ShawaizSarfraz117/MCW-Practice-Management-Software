import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";

interface EditRecurringAvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedOption: "single" | "future" | "all";
  onOptionChange: (option: "single" | "future" | "all") => void;
}

export function EditRecurringAvailabilityModal({
  open,
  onConfirm,
  onOpenChange,
  selectedOption,
  onOptionChange,
}: EditRecurringAvailabilityModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="tracking-normal text-[22px]">
            Edit recurring availability
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-[15px] text-[#717171]">
          <p>
            This availability is part of a recurring series. What would you like
            to edit?
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <input
              checked={selectedOption === "single"}
              className="h-[18px] w-[18px] mr-2 relative top-1"
              id="single"
              name="editOption"
              type="radio"
              onChange={() => onOptionChange("single")}
            />
            <label className="text-[15px] text-[#717171]" htmlFor="single">
              This availability only
            </label>
          </div>
          <div>
            <input
              checked={selectedOption === "future"}
              className="h-[18px] w-[18px] mr-2"
              id="future"
              name="editOption"
              type="radio"
              onChange={() => onOptionChange("future")}
            />
            <label className="text-[15px] text-[#717171]" htmlFor="future">
              This and all future availabilities
            </label>
          </div>
          <div>
            <input
              checked={selectedOption === "all"}
              className="h-[18px] w-[18px] mr-2"
              id="all"
              name="editOption"
              type="radio"
              onChange={() => onOptionChange("all")}
            />
            <label className="text-[15px] text-[#717171]" htmlFor="all">
              All availabilities in the series
            </label>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button
            className="bg-gray-100 hover:bg-gray-200 hover:text-gray-700 text-gray-500"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
