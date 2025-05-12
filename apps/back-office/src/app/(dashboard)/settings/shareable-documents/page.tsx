"use client";

import { Button, Card } from "@mcw/ui";
import { Plus, Share2 } from "lucide-react";

export default function ShareableDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Shareable Documents
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage documents that can be shared with clients and team members.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Document
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <h3 className="font-medium">Practice Policies</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            General practice policies and procedures
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
              Preview
            </Button>
          </div>
        </Card>

        {/* Add more document cards here */}
      </div>
    </div>
  );
}
