import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@mcw/ui";
import { Button } from "@mcw/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import { Separator } from "@mcw/ui";
import { ArrowLeft, ChevronDown, Settings } from "lucide-react";

export const CalendarHeader: React.FC = () => {
  return (
    <header className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button size="icon" variant="ghost">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost">Today</Button>
        <h2 className="text-lg font-semibold">Oct 2025</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-lg">
          <Button className="rounded-r-none" variant="ghost">
            Day
          </Button>
          <Separator orientation="vertical" />
          <Button className="rounded-none bg-emerald-50" variant="ghost">
            Week
          </Button>
          <Separator orientation="vertical" />
          <Button className="rounded-l-none" variant="ghost">
            Month
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2" variant="outline">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              Color: Status
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Available</DropdownMenuItem>
              <DropdownMenuItem>Busy</DropdownMenuItem>
              <DropdownMenuItem>Away</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="icon" variant="ghost">
          <Settings className="h-4 w-4" />
        </Button>

        <Avatar>
          <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MCW_Design_File-mxU5Flus7fWjN7ZKABOCy9HgIHTYRP.png" />
          <AvatarFallback>TM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
