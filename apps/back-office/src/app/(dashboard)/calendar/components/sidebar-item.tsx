import type React from "react";
import { Button } from "@mcw/ui";
import { Badge } from "@mcw/ui";
import type { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  badge?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  badge,
}) => {
  return (
    <Button className="w-full justify-start gap-2" variant="ghost">
      <Icon className="h-4 w-4" />
      {label}
      {badge && (
        <Badge className="ml-auto bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          {badge}
        </Badge>
      )}
    </Button>
  );
};
