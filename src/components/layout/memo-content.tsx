"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Menu,
  User,
  Bot,
  Loader2,
} from "lucide-react";
import { api } from "~/trpc/react";
import { MessageBubble } from "~/components/message/message-bubble";
import { useSidebar } from "~/components/layout/sidebar-context";
import { MemoContentSkeleton } from "~/components/ui/skeleton";

interface MemoContentProps {
  snippetId: string;
}

export function MemoContent({ snippetId }: MemoContentProps) {
  const { open: openSidebar } = useSidebar();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [showSenderSelect, setShowSenderSelect] = useState(false);

  // Long press handlers for mobile title editing
  const startTitleLongPress = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsEditing(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const endTitleLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const utils = api.useUtils();

  const { data: snippet, isLoading } = api.snippet.getById.useQuery({
    id: snippetId,
  });

  const { data: settings } = api.settings.get.useQuery();

  const updateSnippet = api.snippet.update.useMutation({
    onSuccess: () => {
      void utils.snippet.getAll.invalidate();
      void utils.snippet.getById.invalidate({ id: snippetId });
      setIsEditing(false);
    },
  });

  const createMessage = api.message.create.useMutation({
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await utils.snippet.getById.cancel({ id: snippetId });

      // Snapshot previous value
      const previousSnippet = utils.snippet.getById.getData({ id: snippetId });

      // Optimistically update
      if (previousSnippet) {
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          snippetId: newMessage.snippetId,
          sender: newMessage.sender,
          senderType: newMessage.senderType,
          content: newMessage.content,
          displayMode: newMessage.displayMode ?? null,
          position: previousSnippet.messages.length,
          createdAt: new Date(),
        };
        utils.snippet.getById.setData({ id: snippetId }, {
          ...previousSnippet,
          messages: [...previousSnippet.messages, optimisticMessage],
        });
      }

      setInputValue("");
      setShowSenderSelect(false);

      return { previousSnippet };
    },
    onError: (_err, _newMessage, context) => {
      // Rollback on error
      if (context?.previousSnippet) {
        utils.snippet.getById.setData({ id: snippetId }, context.previousSnippet);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      void utils.snippet.getById.invalidate({ id: snippetId });
    },
  });

  useEffect(() => {
    if (snippet) {
      setEditTitle(snippet.title);
    }
  }, [snippet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [snippet?.messages]);

  const handleSendMessage = (senderType: "user" | "ai", sender?: string) => {
    if (!inputValue.trim()) return;

    const senderName =
      senderType === "user"
        ? settings?.userName ?? "あなた"
        : sender ?? "AI";

    createMessage.mutate({
      snippetId,
      sender: senderName,
      senderType,
      content: inputValue.trim(),
      displayMode: settings?.defaultDisplayMode === "plain" ? "plain" : "markdown",
    });
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== snippet?.title) {
      updateSnippet.mutate({ id: snippetId, title: editTitle.trim() });
    } else {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return <MemoContentSkeleton />;
  }

  if (!snippet) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#f9f7f2]">
        <div className="text-gray-400">メモが見つかりません</div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[#f9f7f2]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-3">
        {/* Menu Button */}
        <button
          onClick={openSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="メニューを開く"
        >
          <Menu size={24} />
        </button>

        {/* Title - Centered */}
        <div className="flex-1 min-w-0 flex justify-center">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
              className="w-full max-w-md text-xl font-bold text-gray-800 text-center bg-transparent border-b-2 border-orange-500 focus:outline-none"
            />
          ) : (
            <h1
              onClick={() => {
                // PC only: click to edit
                if (window.matchMedia("(min-width: 1024px)").matches) {
                  setIsEditing(true);
                }
              }}
              onTouchStart={startTitleLongPress}
              onTouchEnd={endTitleLongPress}
              onTouchCancel={endTitleLongPress}
              className="text-xl font-bold text-gray-800 lg:cursor-pointer lg:hover:text-orange-500 transition-colors truncate select-none text-center"
            >
              {snippet.title}
            </h1>
          )}
        </div>

      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {snippet.messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            メッセージを追加してください
          </div>
        ) : (
          snippet.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              snippetId={snippetId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="メッセージを入力..."
            rows={3}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowSenderSelect(!showSenderSelect)}
              disabled={!inputValue.trim() || createMessage.isPending}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMessage.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Sender Select Popup */}
        {showSenderSelect && inputValue.trim() && (
          <div className="absolute bottom-24 right-8 bg-white rounded-xl shadow-lg border border-gray-200 p-2 min-w-48">
            <button
              onClick={() => handleSendMessage("user")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User size={18} />
              <span>{settings?.userName ?? "あなた"}</span>
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => handleSendMessage("ai", "ChatGPT")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bot size={18} />
              <span>ChatGPT</span>
            </button>
            <button
              onClick={() => handleSendMessage("ai", "Claude")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bot size={18} />
              <span>Claude</span>
            </button>
            <button
              onClick={() => handleSendMessage("ai", "Gemini")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bot size={18} />
              <span>Gemini</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
