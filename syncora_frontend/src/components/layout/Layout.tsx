import React from "react";
import { Navbar } from "@/components/common/Navbar";
import { Sidebar } from "@/components/common/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";

const Layout = () => (
  <SidebarProvider defaultOpen={true}>
    <div className="flex w-full h-screen">
      <Sidebar />
      <SidebarInset className="flex flex-col flex-1">
        <SubscriptionBanner />
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
);

export default Layout;