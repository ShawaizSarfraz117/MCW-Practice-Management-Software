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
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { useTeamMembers } from "./services/member.service";
import Loading from "@/components/Loading";
import MemberTable from "./components/MemberTable";
import Link from "next/link";
import ManageListOrderSidebar from "./components/ManageListOrderSidebar";
import { SafeUserWithRelations } from "@mcw/types";

export default function TeamMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isManageListOrderOpen, setIsManageListOrderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // Can be made configurable if needed
  const [queryParams, setQueryParams] = useState({
    search: undefined as string | undefined,
    role: undefined as string | undefined,
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, refetch } = useTeamMembers(queryParams);

  const teamMembers = data?.data || [];
  const pagination = data?.pagination;

  useEffect(() => {
    refetch();
  }, [queryParams, refetch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    setQueryParams({
      search: searchQuery || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      page: 1,
      pageSize,
    });
  };

  const handleSearchIconClick = () => {
    setCurrentPage(1); // Reset to first page on new search
    setQueryParams({
      search: searchQuery || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      page: 1,
      pageSize,
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setQueryParams({
      ...queryParams,
      page: newPage,
    });
  };

  const handleRowClick = (member: object) => {
    const teamMember = member as SafeUserWithRelations;
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
            onClick={() => setIsManageListOrderOpen(true)}
          >
            Manage List Order
          </Button>
          <Link href="/settings/team-members/add">
            <Button
              className="bg-[#2D8467] text-white hover:bg-[#256b53] rounded-md px-4 py-2 text-base font-normal"
              size="sm"
            >
              Add Team Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <form className="relative w-[230px]" onSubmit={handleSearch}>
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
            setCurrentPage(1); // Reset to first page on role change
            setQueryParams({
              search: searchQuery || undefined,
              role: value !== "all" ? value : undefined,
              page: 1,
              pageSize,
            });
          }}
        >
          <SelectTrigger className="w-[180px] bg-white h-10">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="CLINICIAN.BASIC">Clinician - Basic</SelectItem>
            <SelectItem value="CLINICIAN.BILLING">
              Clinician - Billing
            </SelectItem>
            <SelectItem value="CLINICIAN.FULL-CLIENT-LIST">
              Clinician - Full Client List
            </SelectItem>
            <SelectItem value="CLINICIAN.ENTIRE-PRACTICE">
              Clinician - Entire Practice
            </SelectItem>
            <SelectItem value="CLINICIAN.SUPERVISOR">
              Clinician - Supervisor
            </SelectItem>
            <SelectItem value="ADMIN.PRACTICE-MANAGER">
              Admin - Practice Manager
            </SelectItem>
            <SelectItem value="ADMIN.PRACTICE-BILLER">
              Admin - Practice Biller
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
        <MemberTable rows={teamMembers} onRowClick={handleRowClick} />
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.total,
                )}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span> results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-1"
              disabled={currentPage === 1}
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-700 px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              className="flex items-center gap-1"
              disabled={currentPage === pagination.totalPages}
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <ManageListOrderSidebar
        isOpen={isManageListOrderOpen}
        onClose={() => setIsManageListOrderOpen(false)}
      />
    </section>
  );
}
