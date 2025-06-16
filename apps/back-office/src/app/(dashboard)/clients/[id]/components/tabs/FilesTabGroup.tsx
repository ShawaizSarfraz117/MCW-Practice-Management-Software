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
  Trash2,
  ChevronUp,
  Loader2,
  AlertCircle,
  Upload,
  Bell,
} from "lucide-react";
import {
  useState,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  useClientGroupFiles,
  useUploadClientFile,
  useDownloadFile,
} from "@/(dashboard)/clients/hooks/useClientFiles";
import { ClientFile } from "@mcw/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";

type SortColumn = "name" | "type" | "status" | "updated";
type SortDirection = "asc" | "desc";

export interface FilesTabRef {
  triggerFileUpload: () => void;
}

interface FilesTabGroupProps {
  clientGroupId: string;
  clients: Array<{ id: string; name: string }>;
  onShareFile?: (file: ClientFile) => void;
}

function useFileSorting(filesData: ClientFile[]) {
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
  clients: Array<{ id: string; name: string }>,
  clientGroupId: string,
  onShareFile?: (file: ClientFile) => void,
) {
  const queryClient = useQueryClient();
  const downloadFileMutation = useDownloadFile();
  const { toast } = useToast();

  const handleDownload = async (file: ClientFile) => {
    // For practice uploads or shared files, use the API to get SAS token
    await downloadFileMutation.mutateAsync(file.id);
  };

  const handleShareWithClient = (file: ClientFile) => {
    if (onShareFile) {
      onShareFile(file);
    }
  };

  const deleteFileMutation = useMutation({
    mutationFn: async ({
      fileId,
      clientId,
    }: {
      fileId: string;
      clientId: string;
    }) => {
      const response = await fetch(`/api/client/files/${fileId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.hasLockedChildren) {
          throw new Error(
            "Cannot delete file - one or more shared instances are locked",
          );
        }
        throw new Error(data.error || "Failed to delete file");
      }

      // Check if confirmation is required (practice upload with shares)
      if (data.requiresConfirmation) {
        // Automatically confirm deletion
        const confirmResponse = await fetch(
          `/api/client/files/${fileId}/confirm-delete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ confirmDelete: true }),
          },
        );

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok) {
          throw new Error(confirmData.error || "Failed to delete file");
        }

        return { ...confirmData, clientId };
      }

      return { ...data, clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["clientFiles", data.clientId],
      });
      if (clientGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["clientGroupFiles", clientGroupId],
        });
      }
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  const handleDelete = async (file: ClientFile) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      const targetClientId = file.clientId || clients[0]?.id || "";
      await deleteFileMutation.mutateAsync({
        fileId: file.id,
        clientId: targetClientId,
      });
    }
  };

  return { handleDownload, handleShareWithClient, handleDelete };
}

const FilesTabGroup = forwardRef<FilesTabRef, FilesTabGroupProps>(
  ({ clientGroupId, clients, onShareFile }, ref) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Fetch client files from database
    const {
      data: filesData = [],
      isLoading,
      error,
    } = useClientGroupFiles(clientGroupId, clients);
    const uploadFileMutation = useUploadClientFile(
      clients[0]?.id || "",
      clientGroupId,
    );

    const handleSendReminder = () => {
      // TODO: Implement send reminder functionality
      console.log("Send reminder clicked");
    };

    // Filter files based on search and status
    const filteredFiles = useMemo(() => {
      let filtered = filesData;

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter((file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter((file) => {
          switch (statusFilter) {
            case "pending":
              return file.status === "Pending";
            case "completed":
              return (
                file.status === "Completed" || file.status === "Completed JA"
              );
            case "scheduled":
              return file.status === "Scheduled";
            case "locked":
              return file.status === "Locked";
            case "uploaded":
              return file.status === "Uploaded";
            default:
              return true;
          }
        });
      }

      return filtered;
    }, [filesData, searchQuery, statusFilter]);

    const { sortedFilesData, handleSort, getSortIcon } =
      useFileSorting(filteredFiles);
    const { handleDownload, handleShareWithClient, handleDelete } =
      useFileActions(clients, clientGroupId, onShareFile);

    const handleFileUpload = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const files = event.target.files;
      if (!files) return;

      // Upload each file
      const uploadPromises = Array.from(files).map((file) => {
        return uploadFileMutation.mutateAsync({
          file,
          title: file.name,
        });
      });

      try {
        await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Failed to upload some files:", error);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const triggerFileUpload = () => {
      fileInputRef.current?.click();
    };

    useImperativeHandle(ref, () => ({
      triggerFileUpload,
    }));

    // Show loading state
    if (isLoading) {
      return (
        <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          </div>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">Failed to load files</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 h-10 bg-white border-[#e5e7eb]"
              placeholder="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-10 bg-white border-[#e5e7eb]">
                <SelectValue placeholder="All files" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All files</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
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
                  onClick={() => triggerFileUpload()}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </DropdownMenuItem>
                {clients.length > 0 && (
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Trigger the parent's share modal
                      if (onShareFile) {
                        onShareFile({} as ClientFile); // Pass empty file since we're sharing from Actions menu
                      }
                    }}
                  >
                    <Share className="h-4 w-4" />
                    Share with client
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => handleSendReminder()}
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
              {sortedFilesData.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-8"
                    colSpan={5}
                  >
                    {searchQuery || statusFilter !== "all"
                      ? "No files match your filters"
                      : "No files uploaded yet"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedFilesData.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <span className={file.nameColor}>{file.name}</span>
                    </TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={file.statusColor}>{file.status}</span>
                        {file.clientInitials && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-medium">
                            {file.clientInitials}
                          </span>
                        )}
                      </div>
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
                          <Button
                            className="h-8 w-8 p-0"
                            size="sm"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {(file.status === "Completed" ||
                            file.status === "Completed JA" ||
                            file.isPracticeUpload) && (
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          {file.isPracticeUpload && (
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleShareWithClient(file)}
                            >
                              <Share className="h-4 w-4" />
                              Share with client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className={`flex items-center gap-2 ${
                              file.hasLockedChildren
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 focus:text-red-600"
                            }`}
                            onClick={() =>
                              !file.hasLockedChildren && handleDelete(file)
                            }
                            disabled={file.hasLockedChildren}
                          >
                            <Trash2 className="h-4 w-4" />
                            {file.hasLockedChildren
                              ? "Delete (Locked)"
                              : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  },
);

FilesTabGroup.displayName = "FilesTabGroup";

export default FilesTabGroup;
