import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: (selectedUsers: User[]) => void;
}

const availableUsers: User[] = [
  {
    id: "1",
    name: "Jamie",
    initials: "JA",
  },
  {
    id: "2",
    name: "Karen",
    initials: "KA",
  },
  {
    id: "3",
    name: "Shawaiz",
    initials: "SS",
  },
];

export default function ShareModal({
  isOpen,
  onClose,
  onShare,
}: ShareModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const handleUserToggle = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(selectedUsers);
    }
    setSelectedUsers([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedUsers([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">
              Select whom you want to share items with:
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="flex justify-center gap-8">
            {availableUsers.map((user) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);
              return (
                <div
                  key={user.id}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleUserToggle(user)}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-medium text-lg mb-2 transition-all ${
                      isSelected
                        ? "bg-blue-600 ring-2 ring-blue-300"
                        : "bg-gray-500 hover:bg-gray-600"
                    }`}
                  >
                    {user.initials}
                  </div>
                  <span className="text-sm text-gray-700">{user.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleShare}
            disabled={selectedUsers.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8"
          >
            Continue to Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
