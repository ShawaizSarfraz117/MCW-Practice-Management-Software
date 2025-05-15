import React from "react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { Trash2 } from "lucide-react";

interface DeleteTemplateDialogProps {
  onDelete: () => void;
}
export function DeleteTemplateDialog({ onDelete }: DeleteTemplateDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-gray-100"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 text-gray-500" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Are you sure?</h2>
            <p className="text-sm text-gray-600">
              Do you want to delete this template?
            </p>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 px-4"
              >
                Delete Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
