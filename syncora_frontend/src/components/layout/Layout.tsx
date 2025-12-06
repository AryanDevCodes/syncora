import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/common/Sidebar";
import { Navbar } from "@/components/common/Navbar";
import { Outlet } from "react-router-dom";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";

const Layout = () => (
  <SidebarProvider defaultOpen={true}>
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SubscriptionBanner />
        <div className="sticky top-0 z-50 flex items-center gap-2 h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
          <Navbar />
        </div>
        <main className="flex-1 overflow-hidden h-0">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default Layout;