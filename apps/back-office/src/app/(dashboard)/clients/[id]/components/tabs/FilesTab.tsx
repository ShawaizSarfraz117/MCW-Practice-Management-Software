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
import { Search, ChevronDown, MoreHorizontal, ArrowUpDown } from "lucide-react";

export default function FilesTab() {
  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* Search and Filters */}
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
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="measures">Measures</SelectItem>
              <SelectItem value="images">Images</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#2d8467] hover:bg-[#236c53]">
            Actions <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Files Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium">Type</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">
                <div className="flex items-center">
                  Updated <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <span className="text-blue-500">GAD-7</span>
              </TableCell>
              <TableCell>Measure</TableCell>
              <TableCell>
                <span className="text-green-600">Completed JA</span>
              </TableCell>
              <TableCell>2/6/25</TableCell>
              <TableCell>
                <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <span className="text-blue-500">GAD-7</span>
              </TableCell>
              <TableCell>Measure</TableCell>
              <TableCell>
                <span className="text-green-600">Completed JA</span>
              </TableCell>
              <TableCell>2/8/25</TableCell>
              <TableCell>
                <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
