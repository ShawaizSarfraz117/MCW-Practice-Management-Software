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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  ArrowUpDown,
  Download,
  Share,
  Edit,
  Trash2,
  ChevronUp,
} from "lucide-react";
import {
  useState,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

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
];

type FileData = (typeof initialFilesData)[0];
type SortColumn = "name" | "type" | "status" | "updated";
type SortDirection = "asc" | "desc";

export interface FilesTabRef {
  triggerFileUpload: () => void;
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
) {
  const handleDownload = (file: FileData) => {
    console.log("Download file:", file.name);
  };

  const handleShareWithClient = (file: FileData) => {
    console.log("Share with client:", file.name);
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

const FilesTab = forwardRef<FilesTabRef>((_props, ref) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [filesData, setFilesData] = useState<FileData[]>(initialFilesData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sortedFilesData, handleSort, getSortIcon } =
    useFileSorting(filesData);
  const { handleDownload, handleShareWithClient, handleRename, handleDelete } =
    useFileActions(setFilesData);

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

  useImperativeHandle(ref, () => ({
    triggerFileUpload,
  }));

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 h-10 bg-white border-[#e5e7eb]"
            placeholder="Search files"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px] h-10 bg-white border-[#e5e7eb]">
              <SelectValue placeholder="All files" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All files</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#2d8467] hover:bg-[#236c53]">
            Actions <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept="*/*"
      />

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-gray-900 transition-colors"
                >
                  Name {getSortIcon("name")}
                </button>
              </TableHead>
              <TableHead className="font-medium">
                <button
                  onClick={() => handleSort("type")}
                  className="flex items-center hover:text-gray-900 transition-colors"
                >
                  Type {getSortIcon("type")}
                </button>
              </TableHead>
              <TableHead className="font-medium">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-gray-900 transition-colors"
                >
                  Status {getSortIcon("status")}
                </button>
              </TableHead>
              <TableHead className="font-medium">
                <button
                  onClick={() => handleSort("updated")}
                  className="flex items-center hover:text-gray-900 transition-colors"
                >
                  Updated {getSortIcon("updated")}
                </button>
              </TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFilesData.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <span className={file.nameColor}>{file.name}</span>
                </TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>
                  <span className={file.statusColor}>{file.status}</span>
                </TableCell>
                <TableCell>{file.updated}</TableCell>
                <TableCell>
                  <DropdownMenu
                    open={openDropdown === file.id}
                    onOpenChange={(open) =>
                      setOpenDropdown(open ? file.id : null)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleDownload(file)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleShareWithClient(file)}
                        className="flex items-center gap-2"
                      >
                        <Share className="h-4 w-4" />
                        Share with client
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRename(file)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(file)}
                        className="flex items-center gap-2 text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

FilesTab.displayName = "FilesTab";

export default FilesTab;
