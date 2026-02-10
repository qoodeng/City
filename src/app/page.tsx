import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 space-y-4">
          <div className="h-8 w-48 bg-city-surface animate-pulse rounded" />
          <div className="h-4 bg-city-surface animate-pulse rounded" />
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
