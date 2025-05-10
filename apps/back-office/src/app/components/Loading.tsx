import React from "react";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function Loading({
  message = "Loading...",
  fullScreen = false,
  className = "",
}: LoadingProps) {
  return (
    <div
      className={`flex justify-center ${fullScreen ? "h-screen" : "h-full"} ${className}`}
    >
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#16A34A] mx-auto mb-4" />
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}
