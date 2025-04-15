import { Button } from "@mcw/ui";
import { Dialog, DialogContent, DialogFooter } from "@mcw/ui";
import { Heart } from "lucide-react";
import type React from "react";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog modal open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center p-6 bg-green-600 text-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <Heart className="h-12 w-12" />
        </div>
        <h2 className="text-lg font-semibold mb-2">
          The work you do makes a difference and we're grateful to be a part of
          it.
        </h2>
        <p className="text-sm mb-4">Your items have been sent successfully!</p>
        <DialogFooter>
          <Button
            className="bg-white text-green-600 hover:bg-gray-200"
            onClick={onClose}
          >
            Ok, got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
