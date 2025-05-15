import { ReactNode } from "react";

interface DocumentationLayoutProps {
  children: ReactNode;
}

export default function DocumentationLayout({
  children,
}: DocumentationLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Documentation</h2>
      </div>
      {children}
    </div>
  );
}
