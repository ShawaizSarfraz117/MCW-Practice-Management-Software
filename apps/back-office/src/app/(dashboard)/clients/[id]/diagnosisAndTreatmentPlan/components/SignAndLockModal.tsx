"use client";
import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@mcw/ui";

interface SignAndLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  setName: (v: string) => void;
  credentials: string;
  setCredentials: (v: string) => void;
  onSign: () => void;
}

const SignAndLockModal: React.FC<SignAndLockModalProps> = ({
  open,
  onOpenChange,
  name,
  setName,
  credentials,
  setCredentials,
  onSign,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Sign and lock diagnosis and treatment plan</DialogTitle>
      </DialogHeader>
      <div className="flex flex-row md:flex-col gap-4 mt-2">
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Your name
          </label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="block text-sm font-medium text-gray-700">
            Credentials
          </label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
          />
        </div>
        <div className="flex-1 bg-gray-100 rounded p-4">
          <div className="text-2xl font-signature mb-2">{name}</div>
          <div className="text-sm text-gray-700">Signed by {name}</div>
          <div className="text-sm text-gray-700">{credentials}</div>
          <div className="text-xs text-gray-500 mt-2">May 27, 2025 4:05 PM</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-4">
        Signed and locked notes are uneditable.{" "}
        <a href="#" className="text-blue-600 underline">
          Learn about signing and locking
        </a>
      </div>
      <DialogFooter className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button className="bg-blue-600 text-white" onClick={onSign}>
          Sign and lock
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default SignAndLockModal;
