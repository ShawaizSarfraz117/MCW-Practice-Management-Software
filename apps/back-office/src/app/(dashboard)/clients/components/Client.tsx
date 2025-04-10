/* eslint-disable max-lines-per-function */
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Filter } from "lucide-react";
import { Button, Input, Card, Checkbox } from "@mcw/ui";
import ClientTable from "./ClientTable";
import { useRouter } from "next/navigation";
import { CreateClientDrawer } from "@/(dashboard)/clients/components/CreateClientDrawer";
import { fetchClients } from "../services/client.service";
import { Client } from "@prisma/client";

export default function Clients() {
  const [sortBy, setSortBy] = useState("legal_last_name");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const handleRedirect = (id: string) => {
    router.push(`/clients/${id}`);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const [clients, error] = await fetchClients({
      searchParams: {
        status: statusFilter,
        search: searchQuery,
        sortBy,
      },
    });
    if (!error) {
      setClients(clients as Client[]);
    }
  };

  const statusOptions = [
    { id: "all", label: "All Clients" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
    { id: "waitlist", label: "Waitlist" },
    { id: "contacts", label: "Contacts" },
  ];

  const handleStatusChange = (checked: boolean, status: string) => {
    if (checked) {
      // When a checkbox is checked, it becomes the only selected item
      setStatusFilter([status]);
    } else {
      // When unchecking, clear the selection
      setStatusFilter([]);
    }
  };

  const sortOptions = [
    { id: "legal_first_name", label: "First Name" },
    { id: "legal_last_name", label: "Last Name" },
  ];

  const handleSort = async (field: string) => {
    setSortBy(field);
    setSortDropdownOpen(false);
    const [clients, error] = await fetchClients({
      searchParams: {
        status: statusFilter,
        search: searchQuery,
        sortBy: field,
      },
    });
    if (!error) {
      setClients(clients as Client[]);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [clients, error] = await fetchClients({
        searchParams: {
          status: statusFilter,
          sortBy,
        },
      });
      if (!error) {
        setClients(clients as Client[]);
      }
    };
    fetchData();
  }, [statusFilter, sortBy]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <main className="p-6">
        <CreateClientDrawer
          open={createClientOpen}
          onOpenChange={setCreateClientOpen}
        />

        {/* Transfer Client Data Card */}
        <Card className="mb-8 p-6 relative">
          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            ✕
          </button>

          <div className="flex">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-semibold mb-2">
                Transfer your client data
              </h2>
              <p className="text-gray-600 mb-4">
                Follow our step-by-step guide and work with our SimplePractice
                team to transfer demographic data for your existing clients
              </p>
              <Button className="bg-[#2d8467] hover:bg-[#236c53]">
                Transfer client data
              </Button>
            </div>
            <div className="flex-shrink-0">
              <img
                alt="Transfer illustration"
                className="h-[120px] w-[120px]"
                src="/images/transfer.svg"
              />
            </div>
          </div>
        </Card>

        {/* Clients and Contacts Section */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Clients and contacts</h2>
            <p className="text-sm text-gray-500">Total Clients: 3</p>
          </div>
          <Button
            className="bg-[#2d8467] hover:bg-[#236c53]"
            onClick={() => setCreateClientOpen(true)}
          >
            Add New Client
          </Button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-[230px]">
              <form onSubmit={handleSearch}>
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={handleSearch}
                />
                <Input
                  className="pl-9 px-9 h-10 bg-white border-[#e5e7eb]"
                  placeholder="Search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
            <div ref={dropdownRef} className="relative">
              <Button
                className="border-[#e5e7eb] bg-white h-10 flex items-center"
                variant="outline"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <Filter className="mr-2 h-4 w-4 text-blue-500" />
                Client status
              </Button>

              {statusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-[200px] bg-white border rounded-md shadow-lg z-50">
                  <div className="py-2">
                    {statusOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center px-3 py-1.5"
                      >
                        <Checkbox
                          checked={statusFilter.includes(option.id)}
                          className="mr-2"
                          id={`status-${option.id}`}
                          onCheckedChange={(checked) =>
                            handleStatusChange(checked as boolean, option.id)
                          }
                        />
                        <label
                          className="text-sm cursor-pointer"
                          htmlFor={`status-${option.id}`}
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <div ref={sortDropdownRef} className="relative">
              <Button
                className="border-[#e5e7eb] bg-white h-10"
                variant="outline"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                {sortOptions.find((option) => option.id === sortBy)?.label ||
                  "Sort By"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>

              {sortDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-[150px] bg-white border rounded-md shadow-lg z-50">
                  <div className="py-2">
                    {sortOptions.map((option) => (
                      <div
                        key={option.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSort(option.id)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <ClientTable rows={clients} onRowClick={handleRedirect} />
      </main>
    </div>
  );
}
