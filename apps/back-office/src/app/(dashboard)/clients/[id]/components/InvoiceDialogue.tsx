import { X, ChevronDown } from "lucide-react";
import { Dialog, DialogContent } from "@mcw/ui";
import { Button } from "@mcw/ui";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({ open, onOpenChange }: InvoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-screen flex flex-col p-0 m-0 rounded-none border-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center">
            <button onClick={() => onOpenChange(false)} className="mr-4">
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <h1 className="text-xl font-medium">
              Invoice for Jamie D Appleseed
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-1">
              More
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button className="bg-[#2dbf2d] hover:bg-[#25a825]">
              Add payment
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 bg-[#f9fafb] p-6 overflow-auto flex justify-center">
          <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8">
            <div className="flex justify-between mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">From</p>
                  <p className="font-medium">Alam Naqvi</p>
                </div>
                <div>
                  <p className="font-medium">Invoice</p>
                </div>
              </div>
              <div className="w-24 h-24 bg-[#d9d9d9] rounded-full flex items-center justify-center">
                <span className="text-sm text-gray-600">LOGO</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Bill To
                </p>
                <p className="font-medium">Jamie D. Appleseed</p>
                <p className="text-sm">123 Main Street</p>
                <p className="text-sm">Anytown, CA 12345</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Invoice
                </p>
                <p className="font-medium">#12</p>
                <p className="text-sm">Issued: 03/27/2025</p>
                <p className="text-sm">Due: 04/26/2025</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Client</p>
                <p className="font-medium">Jamie D. Appleseed</p>
                <p className="text-sm">7275101326</p>
                <p className="text-sm">alam@mcnultycw.com</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Provider
                </p>
                <p className="font-medium">Alam Naqvi</p>
                <p className="text-sm">alam@mcnultycw.com</p>
              </div>
            </div>

            {/* Invoice Table */}
            <div className="mb-8">
              <div className="grid grid-cols-12 border-b border-gray-200 pb-2 mb-2">
                <div className="col-span-3 text-sm font-medium text-gray-600">
                  Date
                </div>
                <div className="col-span-6 text-sm font-medium text-gray-600">
                  Description
                </div>
                <div className="col-span-3 text-sm font-medium text-gray-600 text-right">
                  Amount
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-gray-100 py-3">
                <div className="col-span-3 text-sm">03/24/2025</div>
                <div className="col-span-6 text-sm">Professional Services</div>
                <div className="col-span-3 text-sm text-right">$200.00</div>
              </div>

              <div className="grid grid-cols-12 border-b border-gray-100 py-3">
                <div className="col-span-3 text-sm">03/24/2025</div>
                <div className="col-span-6 text-sm">Professional Services</div>
                <div className="col-span-3 text-sm text-right">$200.00</div>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="font-medium">Subtotal</div>
                <div className="text-right">200.00</div>
              </div>
              <div className="flex justify-between">
                <div className="font-medium">Total</div>
                <div className="text-right">200.00</div>
              </div>
              <div className="flex justify-between">
                <div className="font-medium">Amount Paid</div>
                <div className="text-right">0.00</div>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <div className="font-medium">Balance</div>
                <div className="text-right text-xl font-bold">$200.00</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
