"use client";
import { useForm } from "@tanstack/react-form";

const ProfileInfo = ({
  isEditing,
  setIsEditing,
  handleSave,
  form,
}: {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleSave: () => void;
  form: ReturnType<typeof useForm>;
}) => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Profile and Security
        </h1>
        <p className="text-gray-600 mt-1">
          Personal info and security preferences
        </p>
      </div>
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
              form.Field({
                name: "dateOfBirth",
                children: (field) => (
                  <input
                    type="date"
                    value={form.getFieldValue("dateOfBirth") as string}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                ),
              })
            ) : (
              <span className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm text-gray-700">
                {new Date(
                  form.getFieldValue("dateOfBirth") as string,
                ).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileInfo;
