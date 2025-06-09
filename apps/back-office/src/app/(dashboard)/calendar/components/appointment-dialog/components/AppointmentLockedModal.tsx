import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";

interface AppointmentLockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentLockedModal({
  open,
  onOpenChange,
}: AppointmentLockedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="tracking-normal text-[22px]">
            Appointment locked
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-[15px] text-[#717171]">
          <p>This appointment can't be deleted because</p>
          <ul className="list-disc pl-6 mt-2">
            <li>
              An{" "}
              <span className="text-blue-500 underline cursor-pointer">
                invoice
              </span>{" "}
              is attached. Someone with billing or scheduling access must delete
              the invoice before the appointment can be deleted.
            </li>
          </ul>
        </div>
        <DialogFooter>
          <Button
            className="bg-[#0a96d4] hover:bg-[#0a96d4]/90"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
