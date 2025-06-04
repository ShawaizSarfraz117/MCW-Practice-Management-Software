import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Requests | Settings",
  description: "Request management settings",
};

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto bg-gray-50">{children}</div>
    </div>
  );
}
