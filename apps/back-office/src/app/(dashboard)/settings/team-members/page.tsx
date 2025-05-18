"use client";

import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@mcw/ui";
import { Search } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { useTeamMembers } from "./services/member.service";
import Loading from "@/components/Loading";
import MemberTable, { TeamMember } from "./components/MemberTable";

export default function TeamMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [queryParams, setQueryParams] = useState({
    search: undefined as string | undefined,
    role: undefined as string | undefined,
  });

  const { data, isLoading, refetch } = useTeamMembers(queryParams);

  const teamMembers = (data?.data || []) as unknown as TeamMember[];
  const _pagination = data?.pagination;

  useEffect(() => {
    refetch();
  }, [queryParams, refetch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setQueryParams({
      search: searchQuery || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
    });
  };

  const handleSearchIconClick = () => {
    setQueryParams({
      search: searchQuery || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
    });
  };

  const handleRowClick = (member: object) => {
    const teamMember = member as TeamMember;
    window.location.href = `/settings/team-members/${teamMember.id}`;
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading team members..." />;
  }

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
          >
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="relative w-[230px]">
          <Search
            aria-label="Search team members"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
            role="button"
            onClick={handleSearchIconClick}
          />
          <Input
            className="pl-9 px-9 h-10 bg-white border-[#e5e7eb]"
            placeholder="Search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            setQueryParams({
              search: searchQuery || undefined,
              role: value !== "all" ? value : undefined,
            });
          }}
        >
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
        <MemberTable rows={teamMembers} onRowClick={handleRowClick} />
      </div>
    </section>
  );
}
