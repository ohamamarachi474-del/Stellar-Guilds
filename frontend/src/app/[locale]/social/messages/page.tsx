"use client";

import React from "react";
import { mockMessages } from "@/features/social/mockData";
import { ChatWindow } from "@/components/Messaging/ChatWindow";
import { MessageInput } from "@/components/Messaging/MessageInput";

export default function MessagesPage() {
  const handleSend = (text: string) => {
    // stub: integrate with messaging API or store
    console.log("send message", text);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <div className="flex flex-col h-[500px]">
          <ChatWindow messages={mockMessages} />
          <MessageInput onSend={handleSend} />
        </div>
      </div>
    </main>
  );
}
