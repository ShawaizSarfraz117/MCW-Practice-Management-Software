import { Button } from "@mcw/ui";
import { Input } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";

export default function BillingTab() {
  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            className="w-full sm:w-[200px] h-9 bg-white border-[#e5e7eb]"
            value="01/08/2025 - 02/06/2025"
          />
          <Select defaultValue="billable">
            <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
              <SelectValue placeholder="Billable Items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="billable">Billable Items</SelectItem>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="invoices">Invoices</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#2d8467] hover:bg-[#236c53]">New</Button>
      </div>

      {/* Billing Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[120px] font-medium">Date</TableHead>
              <TableHead className="font-medium">Details</TableHead>
              <TableHead className="font-medium">Fee</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Write-Off</TableHead>
              <TableHead className="font-medium" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((item) => (
              <TableRow key={item}>
                <TableCell className="font-medium">FEB 6</TableCell>
                <TableCell>
                  <div>90834</div>
                  <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded">
                    INV #3
                  </div>
                </TableCell>
                <TableCell>$100</TableCell>
                <TableCell>$100</TableCell>
                <TableCell>--</TableCell>
                <TableCell>
                  <div className="flex justify-between items-center">
                    <span className="text-red-500 text-sm">Unpaid</span>
                    <Button className="text-blue-500" variant="link">
                      Manage
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
