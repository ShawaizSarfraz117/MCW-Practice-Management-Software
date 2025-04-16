import type React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@mcw/ui";
import { Loader2 } from "lucide-react";

interface SendingDialogProps {
  isOpen: boolean;
}

export const SendingDialog: React.FC<SendingDialogProps> = ({ isOpen }) => {
  return (
    <Dialog modal open={isOpen}>
      <DialogContent className="sm:max-w-md text-center p-6">
        <DialogHeader>
          <DialogTitle>Sending Email Now</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <p className="text-muted-foreground">
          We are currently sending your email to your client. This process
          should only take a few seconds. Please do not close this window.
        </p>
      </DialogContent>
    </Dialog>
  );
};
