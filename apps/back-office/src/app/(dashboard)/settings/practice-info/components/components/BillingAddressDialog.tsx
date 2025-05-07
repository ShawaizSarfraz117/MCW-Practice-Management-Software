import { Button, Input, Label } from "@mcw/ui";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BillingAddress } from "../hooks/useBillingAddresses";

interface BillingAddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "business" | "client";
  currentAddress?: BillingAddress;
  onSave: (address: BillingAddress) => void;
}

export default function BillingAddressDialog({
  isOpen,
  onClose,
  type,
  currentAddress,
  onSave,
}: BillingAddressDialogProps) {
  const [address, setAddress] = useState<BillingAddress>({
    id: undefined,
    type: type,
    street: undefined,
    city: undefined,
    state: undefined,
    zip: undefined,
  });

  useEffect(() => {
    setAddress(
      currentAddress ?? {
        id: undefined,
        type: type,
        street: undefined,
        city: undefined,
        state: undefined,
        zip: undefined,
      },
    );
  }, [currentAddress, type]);

  const [errors, setErrors] = useState({
    street: false,
    city: false,
    state: false,
    zip: false,
  });

  const handleSave = () => {
    const newErrors = {
      street: !address?.street?.trim(),
      city: !address?.city?.trim(),
      state: !address?.state,
      zip: !address?.zip?.trim(),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }
    onSave(address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg z-50">
        <div className="h-full flex flex-col">
          {/* Dialog Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-medium">
                Add {type === "business" ? "Business" : "Client"} Billing
                Address
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {type === "business"
                  ? "Displayed on your MCW subscription invoices."
                  : "Displayed on your insurance claims and clients facing billing documents such as client invoices, statements, and superbills."}
              </p>
            </div>
            <Button
              className="rounded-full"
              size="icon"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Dialog Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <Label
                className="flex items-center text-sm font-medium text-gray-700"
                htmlFor="street"
              >
                Street
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                className={errors.street ? "border-red-500" : ""}
                defaultValue={currentAddress?.street}
                id="street"
                placeholder="Search address"
                value={address?.street}
                onChange={(e) =>
                  setAddress({ ...address, street: e.target.value })
                }
              />
              {errors.street && (
                <p className="text-sm text-red-500">Street is required</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  className="flex items-center text-sm font-medium text-gray-700"
                  htmlFor="city"
                >
                  City
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  className={errors.city ? "border-red-500" : ""}
                  defaultValue={currentAddress?.city}
                  id="city"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
                {errors.city && (
                  <p className="text-sm text-red-500">City is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  className="flex items-center text-sm font-medium text-gray-700"
                  htmlFor="state"
                >
                  State
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  className={errors.state ? "border-red-500" : ""}
                  defaultValue={currentAddress?.state}
                  id="state"
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                />
                {errors.state && (
                  <p className="text-sm text-red-500">State is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  className="flex items-center text-sm font-medium text-gray-700"
                  htmlFor="zip"
                >
                  ZIP
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  className={errors.zip ? "border-red-500" : ""}
                  defaultValue={currentAddress?.zip}
                  id="zip"
                  value={address.zip}
                  onChange={(e) =>
                    setAddress({ ...address, zip: e.target.value })
                  }
                />
                {errors.zip && (
                  <p className="text-sm text-red-500">
                    Valid ZIP code is required
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    </>
  );
}
