"use client";
import { Button, useForm } from "@mcw/ui";

const ProfileHeader = ({
  isEditing,
  setIsEditing,
  handleSave,
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
                <Button
                  className="text-blue-600 text-sm hover:text-blue-700"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="text-blue-600 text-sm hover:text-blue-700"
                  variant="outline"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                className="text-blue-600 text-sm hover:text-blue-700"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
