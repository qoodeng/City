import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { GlobalErrorBoundary } from "@/components/layout/global-error-boundary";

export const metadata: Metadata = {
  title: "C.I.T.Y.",
  description: "Christian's Issue Tracker Yellow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <GlobalErrorBoundary>
          <AppShell>{children}</AppShell>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
