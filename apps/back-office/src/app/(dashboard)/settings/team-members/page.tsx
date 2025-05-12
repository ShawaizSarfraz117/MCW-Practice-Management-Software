"use client";

import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@mcw/ui";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AddTeamMemberDialog from "./components/AddTeamMemberDialog";

export default function TeamMembersPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Placeholder data for demonstration
  const teamMembers = [
    {
      id: "1",
      name: "Alam Naqvi",
      email: "alam@mcwtlycw.com",
      role: "Clinician with entire practice access",
      avatarUrl: "",
      twoStepVerification: "Off",
      lastSignIn: "Mar 13, 2025 at 4:56 PM",
      specialty: "Behavioral health therapy",
      license: {
        type: "LMFT",
        number: "1234",
        expirationDate: "July 11, 2025",
        state: "AL",
      },
      services: ["Service 1", "Service 2", "Service 3"],
    },
    {
      id: "2",
      name: "John Doe",
      email: "john.doe@mcw.com",
      role: "Admin",
      avatarUrl: "",
      twoStepVerification: "On",
      lastSignIn: "Mar 13, 2025 at 4:56 PM",
    },
  ];

  return (
    <section className="flex flex-col gap-6 w-full max-w-7xl mx-auto pt-2 pb-8 px-2 md:px-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
          <p className="text-gray-500 text-base mt-1">
            Add and manage team members
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            className="border border-gray-200 text-[#2B2B2B] bg-white rounded-md px-4 py-2 text-base font-normal"
            variant="outline"
          >
            Manage List Order
          </Button>
          <Button
            className="bg-[#2D8467] text-white hover:bg-[#256b53] rounded-md px-4 py-2 text-base font-normal"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative w-[230px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className="px-9 h-10 bg-white border-[#e5e7eb]"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px] bg-white h-10">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="clinician">Clinician</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last sign in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.name}
                      </div>
                      <div className="text-gray-500">{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">{member.role}</TableCell>
                <TableCell className="text-gray-700">
                  {member.lastSignIn}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/settings/team-members/${member.id}`}>
                    <Button variant="ghost" className="text-[#2D8467]">
                      Edit
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Team Member Dialog */}
      <AddTeamMemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </section>
  );
}
