import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DesktopShell } from "@/layouts/DesktopShell";
import { SessionProvider } from "@/components/common/SessionProvider";
import { SessionSync } from "@/components/common/SessionSync";
import { ToastProvider } from "@/components/common/ToastProvider";

import { ServiceWorkerManager } from "@/components/pwa/ServiceWorkerManager";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4F46E5",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "VBridgeConnect — Academic & Industry Collaboration Hub",
  description: "Production-grade, role-based collaboration platform connecting students, faculty mentors, coordinators, and industry partners.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VBridge",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900">
        <SessionProvider>
          <SessionSync />
          <ToastProvider>
            <DesktopShell>{children}</DesktopShell>
            <ServiceWorkerManager />
            <InstallPrompt />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
