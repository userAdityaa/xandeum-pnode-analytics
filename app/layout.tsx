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
  title: "Xandeum Analytics - Real-Time Network Insights",
  description:
    "Xandeum Analytics is a comprehensive analytics and monitoring platform for the Xandeum decentralized storage network. It provides node operators, developers, and the community with actionable insights into network health, performance, and distribution. Features include real-time and historical data visualization, node and network health monitoring, risk assessment, resource tracking, interactive maps, and data export in CSV/JSON formats. The platform aggregates and analyzes data from hundreds of pNodes, offering transparent, up-to-date, and in-depth views of network activity and trends. Built with Next.js and React, Xandeum Analytics empowers users with intuitive dashboards, custom visualizations, and open API access for integration and research.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
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
