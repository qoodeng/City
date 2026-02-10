"use client";

import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center justify-between h-12 px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">{title}</h1>
          {description && (
            <span className="text-sm text-muted-foreground">{description}</span>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="h-0.5 hazard-stripe-thin shrink-0" />
    </>
  );
}
