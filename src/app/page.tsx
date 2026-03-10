"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import SettingsModal from "@/components/SettingsModal";
import {
  Conversation,
  Message,
  getConversations,
  saveConversation,
  deleteConversation,
  newConversation,
} from "@/lib/storage";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const convs = getConversations();
    setConversations(convs);
    if (convs.length > 0) setActive(convs[0]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  function refreshConversations() {
    setConversations(getConversations());
  }

  function handleNew() {
    const conv = newConversation();
    setActive(conv);
    setSidebarOpen(false);
  }

  function handleSelect(id: string) {
    const conv = conversations.find((c) => c.id === id);
    if (conv) setActive(conv);
    setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    deleteConversation(id);
    refreshConversations();
    if (active?.id === id) {
      const remaining = getConversations();
      setActive(remaining.length > 0 ? remaining[0] : null);
    }
  }

  const sendMessages = useCallback(
    async (conv: Conversation, messages: Message[]) => {
      const apiKey = localStorage.getItem("the-drummer-api-key");
      if (!apiKey) {
        setSettingsOpen(true);
        return;
      }

      const model = localStorage.getItem("the-drummer-model") || "thedrummer/rocinante-12b";
      setIsLoading(true);

      const updatedMessages: Message[] = [
        ...messages,
        { role: "assistant", content: "" },
      ];
      const updatedConv = { ...conv, messages: updatedMessages, updatedAt: Date.now() };

      if (conv.messages.length <= 1 && messages.length > 0) {
        const firstUserMsg = messages.find((m) => m.role === "user");
        if (firstUserMsg) {
          updatedConv.title = firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "..." : "");
        }
      }

      setActive(updatedConv);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            model,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Error ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    assistantContent += delta;
                    const newMessages: Message[] = [
                      ...messages,
                      { role: "assistant", content: assistantContent },
                    ];
                    setActive((prev) =>
                      prev ? { ...prev, messages: newMessages } : prev
                    );
                  }
                } catch {
                  // skip malformed chunks
                }
              }
            }
          }
        }

        const finalMessages: Message[] = [
          ...messages,
          { role: "assistant", content: assistantContent || "No response received." },
        ];
        const finalConv = { ...updatedConv, messages: finalMessages, updatedAt: Date.now() };
        setActive(finalConv);
        saveConversation(finalConv);
        refreshConversations();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        const finalMessages: Message[] = [
          ...messages,
          { role: "assistant", content: `Error: ${errorMsg}` },
        ];
        const finalConv = { ...updatedConv, messages: finalMessages, updatedAt: Date.now() };
        setActive(finalConv);
        saveConversation(finalConv);
        refreshConversations();
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const conv = active || newConversation();
    const userMessage: Message = { role: "user", content: input.trim() };
    const messages: Message[] = [...conv.messages, userMessage];
    const updatedConv = { ...conv, messages, updatedAt: Date.now() };

    setInput("");
    setActive(updatedConv);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessages(updatedConv, messages);
  }

  function handleRetry() {
    if (!active || isLoading) return;
    const messages = active.messages.slice(0, -1);
    const conv = { ...active, messages };
    setActive(conv);
    sendMessages(conv, messages);
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  return (
    <div className="flex h-dvh bg-zinc-950 text-white overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={active?.id || null}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm text-zinc-400 truncate flex-1">
            {active?.title || "The Drummer"}
          </span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {(!active || active.messages.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  TD
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">The Drummer</h2>
                <p className="text-zinc-500 text-sm max-w-sm">
                  Start a conversation to test your model. Configure your OpenRouter API key and model in settings.
                </p>
              </div>
            )}

            {active?.messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isLast={i === active.messages.length - 1}
                isLoading={isLoading}
                onRetry={
                  msg.role === "assistant" && i === active.messages.length - 1
                    ? handleRetry
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-zinc-800 p-4 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
