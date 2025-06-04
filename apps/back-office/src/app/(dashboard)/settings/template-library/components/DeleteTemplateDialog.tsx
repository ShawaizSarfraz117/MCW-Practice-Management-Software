import React from "react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useDeleteTemplate } from "../hooks/useTemplates";

interface DeleteTemplateDialogProps {
  id?: string;
  title: string;
  onDelete?: () => void;
}

export function DeleteTemplateDialog({
  id,
  title,
  onDelete,
}: DeleteTemplateDialogProps) {
  const [open, setOpen] = React.useState(false);
  const deleteMutation = useDeleteTemplate();

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setOpen(false);
          if (onDelete) {
            onDelete();
          }
        },
      });
    } else if (onDelete) {
      onDelete();
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        className="h-8 w-8 hover:bg-gray-100"
        data-testid="trash-icon"
        size="icon"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 text-gray-500" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Delete template</h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{title}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                className="px-4"
                disabled={deleteMutation.isPending}
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 px-4"
                disabled={deleteMutation.isPending}
                variant="destructive"
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
