import React from "react";
import { mockThreads } from "@/features/social/mockData";
import { ThreadList } from "@/components/Forum/ThreadList";

export default function ForumPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Community Forum
        </h1>
        <ThreadList threads={mockThreads} />
      </div>
    </main>
  );
}
