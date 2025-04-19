"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "@tanstack/react-form";

const SecurityInfo = ({
  isEditing,
  form,
}: {
  isEditing: boolean;
  form: ReturnType<typeof useForm>;
}) => {
  const { data: session } = useSession();

  return (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Date of birth</label>
          {isEditing ? (
            form.Field({
              name: "dateOfBirth",
              children: (field) => (
                <input
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  type="date"
                  value={form.getFieldValue("dateOfBirth") as string}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              ),
            })
          ) : (
            <span className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm text-gray-700">
              {form.getFieldValue("dateOfBirth")
                ? new Date(
                    form.getFieldValue("dateOfBirth") as string,
                  ).toLocaleDateString()
                : "NOT SET"}
            </span>
          )}
        </div>
      </div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">
            Simple Practice security
          </h2>
          <Link
            className="text-blue-600 text-sm hover:text-blue-700"
            href="/settings/security"
          >
            Manage
          </Link>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="text-gray-600">Email:</div>
            <div>{session?.user?.email}</div>
          </div>

          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
              <ShieldAlert className="h-3 w-3 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">
              2-step verification off
            </span>
          </div>

          <div className="flex justify-between items-start">
            <div className="text-gray-600 mt-2">Phone:</div>
            <div className="flex-1 max-w-[250px]">
              {isEditing ? (
                form.Field({
                  name: "phone",
                  children: (field) => (
                    <input
                      type="tel"
                      value={form.getFieldValue("phone") as string}
                      className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm
                      placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  ),
                })
              ) : (
                <span className="text-right block">
                  {(form.getFieldValue("phone") as string) || "Not set"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecurityInfo;
