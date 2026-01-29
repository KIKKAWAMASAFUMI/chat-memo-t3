"use client";

import { useState } from "react";
import { Copy, Check, Trash2, Edit3, User, Bot } from "lucide-react";
import { api } from "~/trpc/react";
import type { Message } from "~/generated/prisma";

interface MessageBubbleProps {
  message: Message;
  snippetId: string;
}

export function MessageBubble({ message, snippetId }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const utils = api.useUtils();

  const updateMessage = api.message.update.useMutation({
    onSuccess: () => {
      void utils.snippet.getById.invalidate({ id: snippetId });
      setIsEditing(false);
    },
  });

  const deleteMessage = api.message.delete.useMutation({
    onSuccess: () => {
      void utils.snippet.getById.invalidate({ id: snippetId });
    },
  });

  const isUser = message.senderType === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      updateMessage.mutate({ id: message.id, content: editContent.trim() });
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm("このメッセージを削除しますか？")) {
      deleteMessage.mutate({ id: message.id });
    }
  };

  return (
    <div
      className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-orange-100 text-orange-600" : "bg-purple-100 text-purple-600"
        }`}
      >
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-2xl ${isUser ? "text-right" : "text-left"}`}>
        {/* Sender Name */}
        <div className="text-xs text-gray-400 mb-1">{message.sender}</div>

        {/* Content */}
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-transparent border-2 border-orange-200"
              : "bg-transparent border-2 border-purple-200"
          }`}
        >
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handleSave();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
              className="w-full min-w-[300px] min-h-[100px] bg-transparent focus:outline-none resize-none text-gray-800"
            />
          ) : (
            <div className="text-gray-800 whitespace-pre-wrap text-left">
              {message.displayMode === "markdown" ? (
                <div className="prose prose-sm max-w-none">
                  {message.content}
                </div>
              ) : (
                message.content
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className={`mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="コピー"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="編集"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
