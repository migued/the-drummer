"use client";

import { Message } from "@/lib/storage";

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  isLoading: boolean;
  onRetry?: () => void;
}

export default function ChatMessage({
  message,
  isLast,
  isLoading,
  onRetry,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
          TD
        </div>
      )}

      <div className={`max-w-[75%] space-y-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-orange-500 text-white rounded-br-md"
              : "bg-zinc-800 text-zinc-100 rounded-bl-md"
          }`}
        >
          {message.content}
          {isLoading && isLast && !isUser && (
            <span className="inline-block w-2 h-4 bg-zinc-400 animate-pulse ml-1 align-middle" />
          )}
        </div>

        {/* Retry button for assistant messages */}
        {!isUser && isLast && !isLoading && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors ml-1 mt-1"
            title="Retry response"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold shrink-0 mt-1">
          U
        </div>
      )}
    </div>
  );
}
