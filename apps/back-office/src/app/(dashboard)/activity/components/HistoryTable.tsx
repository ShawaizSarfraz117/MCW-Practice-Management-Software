"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button, Badge } from "@mcw/ui";
import DataTable from "@/components/table/DataTable";

interface HistoryEntry {
  id: string;
  date: string;
  time: string;
  event: string;
  user_id: string;
  username: string;
  client_name: string | null;
}

interface HistoryTableProps {
  onRowClick: (id: string) => void;
  searchTerm: string;
  sortOrder: "asc" | "desc";
}

const HistoryTable = ({ onRowClick, searchTerm, sortOrder }: HistoryTableProps) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          sortOrder,
          ...(searchTerm && { search: searchTerm })
        });

        const response = await fetch(`/api/history?${params}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const data = await response.json();
        setHistory(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [searchTerm, sortOrder, pagination.page, pagination.limit]);

  const columns = [
    {
      key: "date",
      label: "Date",
    },
    {
      key: "time",
      label: "Time",
    },
    {
      key: "event",
      label: "Event",
      formatter: (row: HistoryEntry) => {
        const userText = row.username === 'System' ? 'System' : row.username;
        return row.client_name 
          ? `${userText} ${row.event} for ${row.client_name}`
          : `${userText} ${row.event}`;
      }
    },
  ];

  return (
    <div className="relative min-h-[400px]">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : null}
      <DataTable 
        columns={columns} 
        rows={history} 
        onRowClick={onRowClick}
        pagination={{
          total: pagination.total,
          pages: pagination.pages,
          current: pagination.page,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
      />
    </div>
  );
};

export default HistoryTable;
