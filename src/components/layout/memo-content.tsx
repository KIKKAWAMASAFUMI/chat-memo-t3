"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Trash2,
  Edit3,
  MoreVertical,
  User,
  Bot,
  Copy,
  Check,
} from "lucide-react";
import { api } from "~/trpc/react";
import { MessageBubble } from "~/components/message/message-bubble";

interface MemoContentProps {
  snippetId: string;
}

export function MemoContent({ snippetId }: MemoContentProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [showSenderSelect, setShowSenderSelect] = useState(false);

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

  const deleteSnippet = api.snippet.delete.useMutation({
    onSuccess: () => {
      router.push("/");
    },
  });

  const createMessage = api.message.create.useMutation({
    onSuccess: () => {
      void utils.snippet.getById.invalidate({ id: snippetId });
      setInputValue("");
      setShowSenderSelect(false);
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

  const handleDelete = () => {
    if (confirm("このメモを削除しますか？")) {
      deleteSnippet.mutate({ id: snippetId });
    }
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== snippet?.title) {
      updateSnippet.mutate({ id: snippetId, title: editTitle.trim() });
    } else {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#f9f7f2]">
        <div className="text-gray-400">読み込み中...</div>
      </main>
    );
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
            className="text-xl font-bold text-gray-800 bg-transparent border-b-2 border-orange-500 focus:outline-none"
          />
        ) : (
          <h1
            onClick={() => setIsEditing(true)}
            className="text-xl font-bold text-gray-800 cursor-pointer hover:text-orange-500 transition-colors"
          >
            {snippet.title}
          </h1>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit3 size={20} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Trash2 size={20} />
          </button>
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
              <Send size={20} />
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
