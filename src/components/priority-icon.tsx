"use client";

import {
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  MoreHorizontal,
} from "lucide-react";
import { PRIORITY_CONFIG, type Priority } from "@/lib/constants";

const PRIORITY_ICONS: Record<Priority, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  urgent: AlertTriangle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
  none: MoreHorizontal,
};

export function PriorityIcon({
  priority,
  showLabel = false,
  size = 16,
}: {
  priority: Priority;
  showLabel?: boolean;
  size?: number;
}) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = PRIORITY_ICONS[priority];

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
