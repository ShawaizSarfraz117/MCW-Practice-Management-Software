import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Column {
  key: string;
  formatter?: (value: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  rows: Record<string, any>[];
}

const renderCellContent = (row: Record<string, any>, column: Column): React.ReactNode => {
  if (column.formatter && typeof column.formatter === 'function') {
    return column.formatter(row);
  }
  const value = column.key.split('.').reduce((acc, key) => acc && acc[key], row);
  return String(value ?? '');
};

const DataTable: React.FC<TableProps> = ({ rows, columns }) => {
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
              <TableRow key={rowIndex}>
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
