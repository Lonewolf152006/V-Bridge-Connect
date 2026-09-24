import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DesktopShell } from "@/layouts/DesktopShell";
import { PresentationControlPanel } from "@/components/dev/PresentationControlPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VBridgeConnect — Academic & Industry Collaboration Hub",
  description: "Production-grade, role-based collaboration platform connecting students, faculty mentors, coordinators, and industry partners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900">
        <DesktopShell>{children}</DesktopShell>
        <PresentationControlPanel />
      </body>
    </html>
  );
}
