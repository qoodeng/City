"use client";

import { Badge } from "@/components/ui/badge";

export function LabelBadge({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <Badge
      variant="outline"
      className="text-xs px-1.5 py-0 h-5 font-normal border-0"
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {name}
    </Badge>
  );
}
