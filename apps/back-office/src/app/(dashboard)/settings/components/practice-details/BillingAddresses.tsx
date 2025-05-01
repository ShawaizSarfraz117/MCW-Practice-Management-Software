import { Button } from "@mcw/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import { useState } from "react";
import BillingAddressDialog from "./components/BillingAddressDialog";

interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface BillingAddresses {
  business_address?: BillingAddress;
  client_address?: BillingAddress;
}

type AddressType = "business" | "client";

export default function BillingAddresses() {
  const [billingAddresses, setBillingAddresses] = useState<BillingAddresses>(
    {},
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AddressType>("business");

  const handleOpenDialog = (type: AddressType) => {
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleSaveAddress = (address: BillingAddress) => {
    setBillingAddresses((prev) => ({
      ...prev,
      [editingType === "business" ? "business_address" : "client_address"]:
        address,
    }));
  };

  const formatAddress = (address?: BillingAddress) => {
    if (!address) return "No address added";
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Billing Addresses
          </h2>
          <p className="text-gray-600 mt-1">
            Your business billing address will be displayed on your
            SimplePractice subscription invoices. The client billing address
            will be displayed on your insurance claims and client-facing billing
            documents such as invoices, statements, and superbills.
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address / Office</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Business Billing</TableCell>
            <TableCell className="text-gray-500">
              {formatAddress(billingAddresses.business_address)}
            </TableCell>
            <TableCell>
              <Button
                className="text-emerald-600 hover:text-emerald-700"
                variant="ghost"
                onClick={() => handleOpenDialog("business")}
              >
                {billingAddresses.business_address ? "Edit" : "Add"}
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Client Billing</TableCell>
            <TableCell className="text-gray-500">
              {formatAddress(billingAddresses.client_address)}
            </TableCell>
            <TableCell>
              <Button
                className="text-emerald-600 hover:text-emerald-700"
                variant="ghost"
                onClick={() => handleOpenDialog("client")}
              >
                {billingAddresses.client_address ? "Edit" : "Add"}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <BillingAddressDialog
        currentAddress={
          editingType === "business"
            ? billingAddresses.business_address
            : billingAddresses.client_address
        }
        isOpen={dialogOpen}
        type={editingType}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveAddress}
      />
    </div>
  );
}
