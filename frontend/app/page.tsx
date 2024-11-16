"use client";

import { AppSidebar } from "@/components/left-sidebar";

import { DataSelector } from "@/components/data-selector";

export default function Home() {
  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* <AppSidebar /> */}
      <div className="w-32"></div> {/* Spacer div */}
      <main className="flex-l">
        <h1 className="text-2xl font-bold p-4 text-left">
          Project LLaMA: Low-carbon Lifecycle and Microgrid Adaption
        </h1>
        <div className="flex gap-4 p-4">
          <DataSelector options={options} />
          <DataSelector options={options} />
          <DataSelector options={options} />
        </div>
      </main>
    </div>
  );
}
