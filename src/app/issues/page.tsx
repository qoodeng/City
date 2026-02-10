import { Suspense } from "react";
import { IssuesPageClient } from "./client";

export default function IssuesPage() {
  return (
    <Suspense>
      <IssuesPageClient />
    </Suspense>
  );
}
