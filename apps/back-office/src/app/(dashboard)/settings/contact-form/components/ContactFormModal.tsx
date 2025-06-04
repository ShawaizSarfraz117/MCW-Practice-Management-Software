"use client";
import { Button } from "@mcw/ui";

export default function ContactFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="text-lg font-semibold mb-2">Alam Naqvi</div>
        <div className="text-2xl font-bold mb-6 text-center">Send Message</div>
        <form className="space-y-6">
          <div>
            <div className="font-semibold mb-2">Your info</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First name<span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last name<span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name you go by
                </label>
                <input className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of birth
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="tel"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select className="w-full border rounded px-3 py-2">
                  <option>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  State<span className="text-red-500">*</span>
                </label>
                <select className="w-full border rounded px-3 py-2">
                  <option>Select</option>
                  {/* Add state options here */}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Select the state you live in
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Is there anything else you want to share?
            </label>
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="For example: what you'd like to focus on, insurance or payment questions, etc."
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button className="bg-green-700 hover:bg-green-800 text-white">
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
