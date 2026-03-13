import React from "react";
import { mockFeed } from "@/features/social/mockData";
import { Feed } from "@/features/social/components/Feed";

export default function SocialFeedPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Community Feed</h1>
        <Feed items={mockFeed} />
      </div>
    </main>
  );
}
