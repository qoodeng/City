"use client";

import {
  CircleDashed,
  Circle,
  CircleDot,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { STATUS_CONFIG, type Status } from "@/lib/constants";

const STATUS_ICONS: Record<Status, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  backlog: CircleDashed,
  todo: Circle,
  in_progress: CircleDot,
  done: CircleCheck,
  cancelled: CircleX,
};

export function StatusBadge({
  status,
  showLabel = false,
  size = 16,
}: {
  status: Status;
  showLabel?: boolean;
  size?: number;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = STATUS_ICONS[status];

  return (
    <div className="flex items-center gap-1.5">
      <Icon
        className="shrink-0"
        style={{ color: config.color, width: size, height: size }}
      />
      {showLabel && (
        <span className="text-sm" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );
}
