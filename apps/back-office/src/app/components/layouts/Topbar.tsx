"use client";
import { signOut } from "next-auth/react";
import {
  Search,
  Plus,
  Share,
  MessageSquare,
  User,
  Menu,
  LogOut,
  Settings,
} from "lucide-react";
import { Button, useIsMobile } from "@mcw/ui";
import { Input } from "@mcw/ui";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mcw/ui";
import Sidebar from "./Sidebar";

interface TopBarProps {
  showSearch?: boolean;
  showMenuBar?: boolean;
}

export default function TopBar({
  showSearch = true,
  showMenuBar = true,
}: TopBarProps) {
  const userImage = null;

  const isMobile = useIsMobile();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {isMobile && (
          <Sheet>
            {showMenuBar && (
              <SheetTrigger asChild>
                <Button className="md:hidden" size="icon" variant="ghost">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
            )}

            <SheetContent className="p-0" side="left">
              <Sidebar mobile={true} />
            </SheetContent>
          </Sheet>
        )}
        {showSearch && (
          <div className="relative w-[180px] sm:w-[230px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="!pl-8 h-10 bg-white border-[#e5e7eb]"
              placeholder="Search clients"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm text-gray-500">Fee income</div>
          <div className="font-semibold">$100.00</div>
        </div>

        <Button className="h-8 w-8 hidden sm:flex" size="icon" variant="ghost">
          <Plus className="h-5 w-5" />
        </Button>

        <Button className="h-8 w-8 hidden sm:flex" size="icon" variant="ghost">
          <Share className="h-5 w-5" />
        </Button>

        <Button
          className="bg-[#2d8467] hover:bg-[#236c53] hidden sm:flex"
          variant="default"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="font-medium h-8 w-8 p-0 rounded-full"
              variant="ghost"
            >
              <Avatar className="h-8 w-8">
                {userImage ? <AvatarImage alt="User" src={userImage} /> : null}
                <AvatarFallback className="bg-[#2d8467] text-white">
                  AN
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Alam Naqvi</p>
                <p className="text-xs text-muted-foreground">
                  alam@mcnultycw.com
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:text-red-500"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
