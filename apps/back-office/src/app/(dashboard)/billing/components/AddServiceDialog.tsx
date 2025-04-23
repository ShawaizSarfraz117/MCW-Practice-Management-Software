"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  FormLabel,
  //   Select,
  //   SelectContent,
  //   SelectItem,
  //   SelectTrigger,
  //   SelectValue,
} from "@mcw/ui";
import { toast } from "sonner";

interface AddServcieDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddServcieDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: AddServcieDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    code: "",
    description: "",
    rate: "",
    duration: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (
        !formData.type ||
        !formData.code ||
        !formData.duration ||
        !formData.rate
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const response = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          code: formData.code,
          description: formData.description,
          rate: parseFloat(formData.rate),
          duration: parseInt(formData.duration),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create service");
      }

      toast.success("Service created successfully");
      onSuccess?.();
      onClose();
      setFormData({
        type: "",
        code: "",
        description: "",
        rate: "",
        duration: "",
      });
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-4 max-h-[90vh] overflow-auto [&>button]:hidden">
        <div className="absolute right-2 top-2">
          <Button
            className="text-[#6b7280] hover:text-[#374151]"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="w-7 h-7" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid mt-6 grid-cols-2 gap-5">
            <div className="w-full">
              <FormLabel className="text-[#374151] text-[14px]">
                Service Type *
              </FormLabel>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="text-[#374151] bg-white text-[14px] w-full border rounded-[5px] outline-none p-2"
                required
              />
            </div>
            <div className="w-full">
              <FormLabel className="text-[#374151] text-[14px]">
                Service Code *
              </FormLabel>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="text-[#374151] bg-white text-[14px] w-full border rounded-[5px] outline-none p-2"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <FormLabel className="text-[#374151] text-[14px]">
              Description
            </FormLabel>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="text-[#374151] bg-white text-[14px] w-full border rounded-[5px] outline-none p-2"
            />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="flex-1">
              <FormLabel className="text-[#374151] text-[14px]">
                Rate *
              </FormLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="text-[#374151] text-[14px] w-full border rounded-[5px] outline-none p-2 pl-8"
                  required
                />
              </div>
            </span>
            <span className="flex-1">
              <FormLabel className="text-[#374151] text-[14px]">
                Default Duration (minutes) *
              </FormLabel>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="0"
                className="text-[#374151] bg-white text-[14px] w-full border rounded-[5px] outline-none p-2"
                required
              />
            </span>
          </div>

          <div className="mt-8 flex items-center justify-end gap-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-transparent text-black hover:bg-gray-50 border border-[lightgray]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2d8467] hover:bg-[#236c53]"
            >
              {loading ? "Creating..." : "Create Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServcieDialog;
