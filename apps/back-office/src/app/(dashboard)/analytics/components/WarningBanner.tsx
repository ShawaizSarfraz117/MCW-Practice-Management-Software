"use client";

import Image from "next/image";

export function WarningBanner() {
  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <Image
          src="/icons/warning.svg"
          alt="Warning"
          width={20}
          height={20}
          className="text-orange-500 mt-1"
        />
        <div>
          <h3 className="font-medium text-orange-900">
            Group appointment data coming soon
          </h3>
          <p className="text-orange-700 mt-1">
            Appointments don't include data from group appointments yet.
          </p>
        </div>
      </div>
    </div>
  );
}
