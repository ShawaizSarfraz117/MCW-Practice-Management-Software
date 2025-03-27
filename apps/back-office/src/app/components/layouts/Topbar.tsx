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
import { Button } from "@mcw/ui";
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

export default function TopBar() {
  const userImage = null;
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#e5e7eb] bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar mobile={true} />
          </SheetContent>
        </Sheet>

        <div className="relative w-[180px] sm:w-[230px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search clients"
            className="pl-9 h-10 bg-white border-[#e5e7eb]"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm text-gray-500">Fee income</div>
          <div className="font-semibold">$100.00</div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
          <Plus className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
          <Share className="h-5 w-5" />
        </Button>

        <Button
          variant="default"
          className="bg-[#2d8467] hover:bg-[#236c53] hidden sm:flex"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="font-medium h-8 w-8 p-0 rounded-full"
            >
              <Avatar className="h-8 w-8">
                {userImage ? <AvatarImage src={userImage} alt="User" /> : null}
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
