import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";

interface DeleteAvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedOption: "single" | "future" | "all";
  onOptionChange: (option: "single" | "future" | "all") => void;
  isRecurring?: boolean;
}

export function DeleteAvailabilityModal({
  open,
  onConfirm,
  onOpenChange,
  selectedOption,
  onOptionChange,
  isRecurring = false,
}: DeleteAvailabilityModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="tracking-normal text-[22px]">
            Delete availability?
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-[15px] text-[#717171]">
          <p>
            {isRecurring
              ? "This availability is part of a recurring series. What would you like to delete?"
              : "Are you sure you want to delete this availability?"}
          </p>
        </div>
        {isRecurring && (
          <div className="space-y-3">
            <div>
              <input
                checked={selectedOption === "single"}
                className="h-[18px] w-[18px] mr-2 relative top-1"
                id="single"
                name="deleteOption"
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
                name="deleteOption"
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
                name="deleteOption"
                type="radio"
                onChange={() => onOptionChange("all")}
              />
              <label className="text-[15px] text-[#717171]" htmlFor="all">
                All availabilities in the series
              </label>
            </div>
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button
            className="bg-gray-100 hover:bg-gray-200 hover:text-gray-700 text-gray-500"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
