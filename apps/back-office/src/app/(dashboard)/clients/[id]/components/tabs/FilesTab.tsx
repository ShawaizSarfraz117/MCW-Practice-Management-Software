import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import {
  useState,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import SendRemindersSidebar from "./SendRemindersSidebar";
import FilesTabContent from "./FilesTabContent";

const initialFilesData = [
  {
    id: 1,
    name: "GAD-7",
    type: "Measure",
    status: "Completed JA",
    statusColor: "text-green-600",
    updated: "2/6/25",
    nameColor: "text-blue-500",
  },
  {
    id: 2,
    name: "GAD-7",
    type: "Measure",
    status: "Completed JA",
    statusColor: "text-green-600",
    updated: "2/8/25",
    nameColor: "text-blue-500",
  },
  {
    id: 3,
    name: "PHQ-9",
    type: "Assessment",
    status: "Pending",
    statusColor: "text-orange-600",
    updated: "2/10/25",
    nameColor: "text-blue-500",
  },
  {
    id: 4,
    name: "Treatment Plan",
    type: "Document",
    status: "Completed",
    statusColor: "text-green-600",
    updated: "2/5/25",
    nameColor: "text-blue-500",
  },
  {
    id: 5,
    name: "Intake Form",
    type: "Document",
    status: "Pending HK",
    statusColor: "text-orange-600",
    updated: "2/12/25",
    nameColor: "text-blue-500",
  },
  {
    id: 6,
    name: "Consent Form",
    type: "Document",
    status: "Pending",
    statusColor: "text-orange-600",
    updated: "2/11/25",
    nameColor: "text-blue-500",
  },
];

type FileData = (typeof initialFilesData)[0];
type SortColumn = "name" | "type" | "status" | "updated";
type SortDirection = "asc" | "desc";

export interface FilesTabRef {
  triggerFileUpload: () => void;
}

interface FilesTabProps {
  onShareFile?: (file: FileData) => void;
  clientName: string;
  clientEmail: string;
  practiceName: string;
}

function useFileSorting(filesData: FileData[]) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedFilesData = useMemo(() => {
    const sorted = [...filesData].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortColumn) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case "status":
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case "updated":
          aValue = new Date(a.updated).getTime().toString();
          bValue = new Date(b.updated).getTime().toString();
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, [filesData, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }

    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  return { sortedFilesData, handleSort, getSortIcon };
}

function useFileActions(
  setFilesData: React.Dispatch<React.SetStateAction<FileData[]>>,
  onShareFile?: (file: FileData) => void,
) {
  const handleDownload = (file: FileData) => {
    console.log("Download file:", file.name);
  };

  const handleShareWithClient = (file: FileData) => {
    console.log("Share with client:", file.name);
    if (onShareFile) {
      onShareFile(file);
    }
  };

  const handleRename = (file: FileData) => {
    console.log("Rename file:", file.name);
  };

  const handleDelete = (file: FileData) => {
    console.log("Delete file:", file.name);
    setFilesData((prev) => prev.filter((f) => f.id !== file.id));
  };

  return { handleDownload, handleShareWithClient, handleRename, handleDelete };
}

const FilesTab = forwardRef<FilesTabRef, FilesTabProps>(
  ({ onShareFile, clientName, clientEmail, practiceName }, ref) => {
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [filesData, setFilesData] = useState<FileData[]>(initialFilesData);
    const [isReminderSidebarOpen, setIsReminderSidebarOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { sortedFilesData, handleSort, getSortIcon } =
      useFileSorting(filesData);
    const {
      handleDownload,
      handleShareWithClient,
      handleRename,
      handleDelete,
    } = useFileActions(setFilesData, onShareFile);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const currentDate = new Date().toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      });

      Array.from(files).forEach((file) => {
        const newFile: FileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: getFileType(file),
          status: "Uploaded",
          statusColor: "text-blue-600",
          updated: currentDate,
          nameColor: "text-blue-500",
        };

        setFilesData((prev) => [newFile, ...prev]);
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const getFileType = (file: File): string => {
      if (file.type.startsWith("image/")) return "Image";
      if (file.type.includes("pdf")) return "PDF";
      if (file.type.includes("document") || file.type.includes("word"))
        return "Document";
      if (file.type.includes("spreadsheet") || file.type.includes("excel"))
        return "Spreadsheet";
      if (file.type.includes("text")) return "Text";
      return "File";
    };

    const triggerFileUpload = () => {
      fileInputRef.current?.click();
    };

    const handleSendReminder = () => {
      setIsReminderSidebarOpen(true);
    };

    useImperativeHandle(ref, () => ({
      triggerFileUpload,
    }));

    return (
      <>
        <FilesTabContent
          fileInputRef={fileInputRef}
          getSortIcon={getSortIcon}
          openDropdown={openDropdown}
          sortedFilesData={sortedFilesData}
          handleDelete={handleDelete}
          handleDownload={handleDownload}
          handleFileUpload={handleFileUpload}
          handleRename={handleRename}
          handleSendReminder={handleSendReminder}
          handleShareWithClient={handleShareWithClient}
          handleSort={handleSort}
          setOpenDropdown={setOpenDropdown}
          triggerFileUpload={triggerFileUpload}
        />

        {/* Send Reminders Sidebar */}
        <SendRemindersSidebar
          clientEmail={clientEmail}
          clientName={clientName}
          filesData={filesData}
          isOpen={isReminderSidebarOpen}
          practiceName={practiceName}
          onClose={() => setIsReminderSidebarOpen(false)}
        />
      </>
    );
  },
);

FilesTab.displayName = "FilesTab";

export default FilesTab;
