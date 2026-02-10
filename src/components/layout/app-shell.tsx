"use client";

import { ReactNode } from "react";
import { Providers } from "./providers";
import { Sidebar } from "./sidebar";
import { NavigationButtons } from "./navigation-buttons";
import { IssueCreateDialog } from "@/components/issues/issue-create-dialog";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcutHandler } from "@/components/keyboard-shortcut-handler";
import { InlinePicker } from "@/components/issues/inline-picker";
import { KeyboardHelp } from "@/components/keyboard-help";
import { PageTransition } from "@/components/layout/page-transition";
import { SplashScreen } from "@/components/startup/splash-screen";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center h-8 shrink-0 [-webkit-app-region:drag]">
            <NavigationButtons />
          </div>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <IssueCreateDialog />
      <CommandPalette />
      <KeyboardShortcutHandler />
      <InlinePicker />
      <KeyboardHelp />
      <SplashScreen />
    </Providers>
  );
}
