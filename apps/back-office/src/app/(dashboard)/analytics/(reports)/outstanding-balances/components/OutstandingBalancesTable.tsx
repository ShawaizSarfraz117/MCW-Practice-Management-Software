"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import {
  OutstandingBalanceItem,
  OutstandingBalanceTotals,
} from "@/(dashboard)/analytics/services/outstanding-balances.service";
import Link from "next/link";

interface OutstandingBalancesTableProps {
  data: OutstandingBalanceItem[];
  totals: OutstandingBalanceTotals;
  isLoading?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export default function OutstandingBalancesTable({
  data,
  totals,
  isLoading,
}: OutstandingBalancesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-200 hover:bg-transparent">
              <TableHead className="text-gray-500">Client</TableHead>
              <TableHead className="text-right text-gray-500">
                Services provided
              </TableHead>
              <TableHead className="text-right text-gray-500">
                Uninvoiced
              </TableHead>
              <TableHead className="text-right text-gray-500">
                Invoiced
              </TableHead>
              <TableHead className="text-right text-gray-500">
                Client paid
              </TableHead>
              <TableHead className="text-right text-gray-500">
                Client balance
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index} className="border-gray-200">
                <TableCell>
                  <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow className="border-gray-200 hover:bg-transparent">
            <TableHead className="text-gray-500">Client</TableHead>
            <TableHead className="text-right text-gray-500">
              Services provided
            </TableHead>
            <TableHead className="text-right text-gray-500">
              Uninvoiced
            </TableHead>
            <TableHead className="text-right text-gray-500">Invoiced</TableHead>
            <TableHead className="text-right text-gray-500">
              Client paid
            </TableHead>
            <TableHead className="text-right text-gray-500">
              Client balance
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Totals Row */}
          <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-200">
            <TableCell className="font-medium text-gray-900">Totals</TableCell>
            <TableCell className="text-right font-medium text-gray-900">
              {formatCurrency(totals.servicesProvided)}
            </TableCell>
            <TableCell className="text-right font-medium text-gray-900">
              {formatCurrency(totals.uninvoiced)}
            </TableCell>
            <TableCell className="text-right font-medium text-gray-900">
              {formatCurrency(totals.invoiced)}
            </TableCell>
            <TableCell className="text-right font-medium text-gray-900">
              {formatCurrency(totals.clientPaid)}
            </TableCell>
            <TableCell className="text-right font-medium text-gray-900">
              {formatCurrency(totals.clientBalance)}
            </TableCell>
          </TableRow>

          {/* Data Rows */}
          {data.length > 0 ? (
            data.map((row) => (
              <TableRow key={row.clientGroupId} className="border-gray-200">
                <TableCell className="text-gray-900">
                  <Link
                    className="text-primary hover:underline cursor-pointer"
                    href={`/clients/${row.clientGroupId}?tab=overview`}
                  >
                    {row.clientGroupName}
                  </Link>
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {row.servicesProvided > 0
                    ? formatCurrency(row.servicesProvided)
                    : "--"}
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {row.uninvoiced !== 0 ? formatCurrency(row.uninvoiced) : "--"}
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {row.invoiced > 0 ? formatCurrency(row.invoiced) : "--"}
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {row.clientPaid > 0 ? formatCurrency(row.clientPaid) : "--"}
                </TableCell>
                <TableCell className="text-right text-blue-600 font-medium">
                  {formatCurrency(row.clientBalance)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="border-gray-200">
              <TableCell className="text-center text-gray-500 py-8" colSpan={6}>
                No outstanding balances found for the selected period
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
