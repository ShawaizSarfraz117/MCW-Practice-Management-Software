import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";

interface Column {
  key: string;
  value: string;
  // TODO: Add right type
  formatter?: (value: unknown) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  // TODO: Add right type
  rows: Record<string, unknown>[];
  onRowClick?: (id: string) => void;
}

const renderCellContent = (
  // TODO: Add right type
  row: Record<string, unknown>,
  column: Column,
): React.ReactNode => {
  if (column.formatter && typeof column.formatter === "function") {
    return column.formatter(row);
  }
  const value = column.key
    .split(".")
    .reduce((acc: Record<string, unknown> | unknown, key: string) => {
      if (acc && typeof acc === "object") {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, row);
  return String(value ?? "");
};

const DataTable: React.FC<TableProps> = ({ rows, columns, onRowClick }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column, index) => (
                <TableHead key={index} className="font-medium">
                  {column.key}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={`${onRowClick ? "cursor-pointer" : null}`}
                // @ts-expect-error - TODO: Add right type
                onClick={() => (onRowClick ? onRowClick(row.id) : null)}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={`${rowIndex}-${colIndex}`}>
                    {renderCellContent(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataTable;
