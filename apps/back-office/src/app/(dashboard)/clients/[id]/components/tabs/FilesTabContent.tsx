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
  Download,
  Edit,
  MoreHorizontal,
  Share,
  Trash2,
  Upload,
  Bell,
} from "lucide-react";
import { RefObject } from "react";

interface FileData {
  id: number;
  name: string;
  type: string;
  status: string;
  statusColor: string;
  updated: string;
  nameColor: string;
}

interface FilesTabContentProps {
  fileInputRef: RefObject<HTMLInputElement>;
  triggerFileUpload: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendReminder: () => void;
  sortedFilesData: FileData[];
  handleSort: (field: "name" | "type" | "status" | "updated") => void;
  getSortIcon: (
    field: "name" | "type" | "status" | "updated",
  ) => React.ReactNode;
  openDropdown: number | null;
  setOpenDropdown: (id: number | null) => void;
  handleDownload: (file: FileData) => void;
  handleShareWithClient: (file: FileData) => void;
  handleRename: (file: FileData) => void;
  handleDelete: (file: FileData) => void;
}

export default function FilesTabContent({
  fileInputRef,
  triggerFileUpload,
  handleFileUpload,
  handleSendReminder,
  sortedFilesData,
  handleSort,
  getSortIcon,
  openDropdown,
  setOpenDropdown,
  handleDownload,
  handleShareWithClient,
  handleRename,
  handleDelete,
}: FilesTabContentProps) {
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#2d8467] hover:bg-[#236c53]">
                Actions <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={triggerFileUpload}
              >
                <Upload className="h-4 w-4" />
                Upload file
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => {
                  // Handle share with client action
                  console.log("Share with client clicked");
                }}
              >
                <Share className="h-4 w-4" />
                Share with client
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={handleSendReminder}
              >
                <Bell className="h-4 w-4" />
                Send reminder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        multiple
        accept="*/*"
        className="hidden"
        type="file"
        onChange={handleFileUpload}
      />

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  Name {getSortIcon("name")}
                </button>
              </TableHead>
              <TableHead className="font-medium">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("type")}
                >
                  Type {getSortIcon("type")}
                </button>
              </TableHead>
              <TableHead className="font-medium">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  Status {getSortIcon("status")}
                </button>
              </TableHead>
              <TableHead className="font-medium">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("updated")}
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
                        className="flex items-center gap-2"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleShareWithClient(file)}
                      >
                        <Share className="h-4 w-4" />
                        Share with client
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleRename(file)}
                      >
                        <Edit className="h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(file)}
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
}
