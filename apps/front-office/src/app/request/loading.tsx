import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-gray-500 text-lg">Loading...</span>
    </div>
  );
}
