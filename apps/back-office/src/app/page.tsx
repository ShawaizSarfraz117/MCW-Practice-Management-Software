import React from "react";
import { Button } from "@mcw/ui";
import { Input } from "@mcw/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Welcome to Back Office</h1>
      <p className="text-xl mb-8">Admin/Therapist Dashboard</p>
      <Button variant="secondary" size="lg">
        Dashboard
      </Button>
      <Input />
    </main>
  );
}
