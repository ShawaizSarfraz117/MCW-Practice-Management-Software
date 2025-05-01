import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Button,
  Input,
  Label,
} from "@mcw/ui";
import { useState } from "react";
import { X } from "lucide-react";

interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

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
  const [address, setAddress] = useState<BillingAddress>(
    currentAddress ?? {
      street: "",
      city: "",
      state: "",
      zip: "",
    },
  );

  const [errors, setErrors] = useState({
    street: false,
    city: false,
    state: false,
    zip: false,
  });

  const handleSave = () => {
    const newErrors = {
      street: !address.street.trim(),
      city: !address.city.trim(),
      state: !address.state,
      zip: !address.zip.trim() || !/^\d{5}(-\d{4})?$/.test(address.zip),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    onSave(address);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <SheetTitle>
              Add {type === "business" ? "Business" : "Client"} Billing Address
            </SheetTitle>
            <Button
              className="h-8 w-8"
              size="icon"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            {type === "business"
              ? "Displayed on your MCW subscription invoices."
              : "Displayed on your insurance claims and client-facing billing documents."}
          </p>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label className="flex items-center" htmlFor="street">
              Street
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              className={errors.street ? "border-red-500" : ""}
              id="street"
              placeholder="Search address"
              value={address.street}
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
              <Label className="flex items-center" htmlFor="city">
                City
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                className={errors.city ? "border-red-500" : ""}
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
              <Label className="flex items-center" htmlFor="state">
                State
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                className={errors.state ? "border-red-500" : ""}
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
              <Label className="flex items-center" htmlFor="zip">
                ZIP
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                className={errors.zip ? "border-red-500" : ""}
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

        <div className="flex justify-end gap-4 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
