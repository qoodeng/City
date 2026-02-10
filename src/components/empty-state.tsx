import { ReactNode } from "react";

/**
 * Themed empty state with crash-test dummy quartered-circle motif.
 */
export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      {/* Quartered-circle motif (same as CrashSpinner, static, muted) */}
      <svg viewBox="0 0 100 100" className="w-10 h-10 opacity-20">
        <path d="M50,50 L50,0 A50,50 0 0,1 100,50 Z" fill="#FFD700" />
        <path d="M50,50 L100,50 A50,50 0 0,1 50,100 Z" fill="#0A0A0A" />
        <path d="M50,50 L50,100 A50,50 0 0,1 0,50 Z" fill="#FFD700" />
        <path d="M50,50 L0,50 A50,50 0 0,1 50,0 Z" fill="#0A0A0A" />
      </svg>
      <div className="w-12 h-px hazard-stripe-thin" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/60">{subtitle}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
