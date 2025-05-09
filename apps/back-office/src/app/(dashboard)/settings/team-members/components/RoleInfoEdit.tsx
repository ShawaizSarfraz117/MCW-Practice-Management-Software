"use client";

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

interface RoleInfoEditProps {
  member: {
    id: string;
    role: string;
  };
  onClose: () => void;
}

export default function RoleInfoEdit({ member, onClose }: RoleInfoEditProps) {
  const queryClient = useQueryClient();

  const { mutate: updateRole } = useMutation({
    mutationFn: async (data: { role: string }) => {
      const response = await fetch(`/api/clinician/${member.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", member.id] });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateRole({
      role: formData.get("role") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Role</Label>
        <Select name="role" defaultValue={member.role}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Practice Owner">Practice Owner</SelectItem>
            <SelectItem value="Practice Administrator">
              Practice Administrator
            </SelectItem>
            <SelectItem value="Clinician with entire practice access">
              Clinician with entire practice access
            </SelectItem>
            <SelectItem value="Clinician with limited access">
              Clinician with limited access
            </SelectItem>
            <SelectItem value="Senior Therapist">Senior Therapist</SelectItem>
            <SelectItem value="Practice Supervisor">
              Practice Supervisor
            </SelectItem>
            <SelectItem value="Practice biller">Practice Biller</SelectItem>
            <SelectItem value="Practice scheduler">
              Practice Scheduler
            </SelectItem>
            <SelectItem value="Front Desk Staff">Front Desk Staff</SelectItem>
            <SelectItem value="Administrative Assistant">
              Administrative Assistant
            </SelectItem>
            <SelectItem value="Intern/Student">Intern/Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-base font-medium text-[#1F2937] mb-4">
          Additional permissions
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h4 className="text-sm font-medium text-[#374151] mb-2">
              Client care
            </h4>
            <ul className="space-y-2 text-[#4B5563] text-sm">
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chart-notes"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="chart-notes">View and create chart notes</label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="questionnaires"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="questionnaires">
                  View completed questionnaires and scored measures
                </label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="documents"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="documents">View client documents</label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="intake"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="intake">
                  View intake documents and uploaded files
                </label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="telehealth"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="telehealth">Access telehealth sessions</label>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#374151] mb-2">
              Operations
            </h4>
            <ul className="space-y-2 text-[#4B5563] text-sm">
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="financial"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="financial">
                  View financial dashboards and reports
                </label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billing"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="billing">Process billing and payments</label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="scheduling"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="scheduling">
                  Manage appointments and scheduling
                </label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="team"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="team">Manage team members</label>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#374151] mb-2">
              Practice Management
            </h4>
            <ul className="space-y-2 text-[#4B5563] text-sm">
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="settings"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="settings">Modify practice settings</label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reports"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="reports">
                  Generate and view practice reports
                </label>
              </li>
              <li className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="audit"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="audit">Access audit logs</label>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
