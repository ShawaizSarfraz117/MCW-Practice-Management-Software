"use client";

import { UseFormRegister } from "react-hook-form";
import { ProfileFormData } from "../Profile";

const ProfileInfo = ({
  isEditing,
  setIsEditing,
  register,
  handleSave,
  defaultValues,
}: {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  register: UseFormRegister<ProfileFormData>;
  handleSave: () => void;
  defaultValues: ProfileFormData;
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">
          SimplePractice profile
        </h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                className="text-blue-600 text-sm hover:text-blue-700"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="text-blue-600 text-sm hover:text-blue-700"
                onClick={handleSave}
              >
                Save
              </button>
            </>
          ) : (
            <button
              className="text-blue-600 text-sm hover:text-blue-700"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Date of birth</label>
          {isEditing ? (
            <input
              type="date"
              {...register("dateOfBirth")}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <span className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400">
              {defaultValues.dateOfBirth
                ? new Date(defaultValues.dateOfBirth).toLocaleDateString()
                : "Not set"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
