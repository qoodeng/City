import React from "react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

export function TestWrapper({ children }: { children: React.ReactNode }) {
  return <NuqsTestingAdapter>{children}</NuqsTestingAdapter>;
}
