"use client";

import { AppSidebar } from "@/components/left-sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1">
        {/* Main content goes here */}
        hi
      </main>
    </div>
  );
}
