import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/navbar";
import { RefreshProvider } from "@/lib/refresh-context";
import { HealthSyncInitializer } from "@/components/health-sync-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xandeum Analytics",
  description: "Xandeum Network Analytics Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RefreshProvider>
          <HealthSyncInitializer />
          <SidebarProvider defaultOpen>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <Navbar />
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </RefreshProvider>
      </body>
    </html>
  );
}
