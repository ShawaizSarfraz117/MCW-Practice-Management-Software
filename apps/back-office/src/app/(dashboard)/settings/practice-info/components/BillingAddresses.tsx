import { Button } from "@mcw/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import { useEffect, useState } from "react";
import BillingAddressDialog from "./components/BillingAddressDialog";
import useBillingAddresses, {
  BillingAddress,
} from "./hooks/useBillingAddresses";

type AddressType = "business" | "client";

export default function BillingAddresses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AddressType>("business");
  const { billingAddresses: billingAddressesData, createBillingAddress } =
    useBillingAddresses();
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>();

  useEffect(() => {
    let addressData: BillingAddress[] = [];
    if (billingAddressesData?.length) {
      addressData = [...billingAddressesData];
      const hasBusinessAddress = addressData.some(
        (address) => address.type === "business",
      );
      const hasClientAddress = addressData.some(
        (address) => address.type === "client",
      );

      if (!hasBusinessAddress) {
        addressData.push({
          id: undefined,
          type: "business",
          street: undefined,
          city: undefined,
          state: undefined,
          zip: undefined,
        });
      }

      if (!hasClientAddress) {
        addressData.push({
          id: undefined,
          type: "client",
          street: undefined,
          city: undefined,
          state: undefined,
          zip: undefined,
        });
      }
    } else {
      addressData = [
        {
          id: undefined,
          type: "business",
          street: undefined,
          city: undefined,
          state: undefined,
          zip: undefined,
        },
        {
          id: undefined,
          type: "client",
          street: undefined,
          city: undefined,
          state: undefined,
          zip: undefined,
        },
      ];
    }
    setBillingAddresses(addressData);
  }, [billingAddressesData]);

  const handleOpenDialog = (type: AddressType) => {
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleSaveAddress = (address: BillingAddress) => {
    createBillingAddress({
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      type: address.type,
    });
  };

  const formatAddress = (address?: BillingAddress) => {
    const formattedAddressArr = [
      address?.street,
      address?.city,
      address?.state,
      address?.zip,
    ];
    const formattedAddress = formattedAddressArr.filter(Boolean).join(", ");
    return formattedAddress ? formattedAddress : "No address added";
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
          {billingAddresses?.map((address) => {
            return (
              <TableRow key={address.id ?? address.type}>
                <TableCell>
                  {address.type === "business"
                    ? "Business Billing"
                    : "Client Billing"}
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatAddress(address)}
                </TableCell>
                <TableCell>
                  <Button
                    className="text-emerald-600 hover:text-emerald-700"
                    variant="ghost"
                    onClick={() => handleOpenDialog(address.type)}
                  >
                    {address.id ? "Edit" : "Add"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <BillingAddressDialog
        currentAddress={
          editingType === "business"
            ? billingAddresses?.find((address) => address.type === "business")
            : billingAddresses?.find((address) => address.type === "client")
        }
        isOpen={dialogOpen}
        type={editingType}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveAddress}
      />
    </div>
  );
}
