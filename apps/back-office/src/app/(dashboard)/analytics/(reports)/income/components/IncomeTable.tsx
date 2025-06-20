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
  IncomeReportItem,
  IncomeReportTotals,
} from "@/(dashboard)/analytics/services/income.service";

interface IncomeTableProps {
  data: IncomeReportItem[];
  totals: IncomeReportTotals;
  isLoading?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  const [year, month] = dateStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
};

export default function IncomeTable({
  data,
  totals,
  isLoading,
}: IncomeTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-200 hover:bg-transparent">
              <TableHead className="text-gray-500">Date</TableHead>
              <TableHead className="text-left text-gray-500">
                Client payments
              </TableHead>
              <TableHead className="text-left text-gray-500">
                Gross income
              </TableHead>
              <TableHead className="text-left text-gray-500">
                Clinician cut
              </TableHead>
              <TableHead className="text-left text-gray-500">
                Net income
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index} className="border-gray-200">
                <TableCell className="text-gray-500">
                  <div className="animate-pulse bg-gray-200 h-4 w-20 rounded" />
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />
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
            <TableHead className="text-gray-500">Date</TableHead>
            <TableHead className="text-left text-gray-500">
              Client payments
            </TableHead>
            <TableHead className="text-left text-gray-500">
              Gross income
            </TableHead>
            <TableHead className="text-left text-gray-500">
              Clinician cut
            </TableHead>
            <TableHead className="text-left text-gray-500">
              Net income
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Totals Row */}
          <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-200">
            <TableCell className="font-medium text-gray-900">Totals</TableCell>
            <TableCell className="text-left font-medium text-gray-900">
              {formatCurrency(totals.clientPayments)}
            </TableCell>
            <TableCell className="text-left font-medium text-gray-900">
              {formatCurrency(totals.grossIncome)}
            </TableCell>
            <TableCell className="text-left font-medium text-gray-900">
              {formatCurrency(totals.clinicianCut)}
            </TableCell>
            <TableCell className="text-left font-medium text-gray-900">
              {formatCurrency(totals.netIncome)}
            </TableCell>
          </TableRow>

          {/* Data Rows */}
          {data.length > 0 ? (
            data.map((row) => (
              <TableRow key={row.date} className="border-gray-200">
                <TableCell className="text-gray-500">
                  {formatDate(row.date)}
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  {row.clientPayments > 0
                    ? formatCurrency(row.clientPayments)
                    : "--"}
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  {row.grossIncome > 0 ? formatCurrency(row.grossIncome) : "--"}
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  {row.clinicianCut > 0
                    ? formatCurrency(row.clinicianCut)
                    : "--"}
                </TableCell>
                <TableCell className="text-left text-gray-500">
                  {row.netIncome > 0 ? formatCurrency(row.netIncome) : "--"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="border-gray-200">
              <TableCell className="text-center text-gray-500 py-8" colSpan={5}>
                No income data found for the selected period
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
