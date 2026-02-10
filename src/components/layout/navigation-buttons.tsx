"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function NavigationButtons() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-0.5 pl-2 [-webkit-app-region:no-drag]">
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => window.history.forward()}
        className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Go forward"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
