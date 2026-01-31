"use client";

import { useState, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Copy, Check, Trash2, Edit3, User, Bot, Code, AlignLeft, Maximize2, X } from "lucide-react";
import { api } from "~/trpc/react";
import { MarkdownRenderer } from "~/components/ui/markdown-renderer";
import { useToast } from "~/components/ui/toast";
import { useLongPress } from "use-long-press";
import type { Message } from "~/generated/prisma";

interface MessageBubbleProps {
  message: Message;
  snippetId: string;
}

export function MessageBubble({ message, snippetId }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const utils = api.useUtils();
  const { showToast } = useToast();

  const updateMessage = api.message.update.useMutation({
    onMutate: async ({ id, content, displayMode }) => {
      await utils.snippet.getById.cancel({ id: snippetId });
      const previousSnippet = utils.snippet.getById.getData({ id: snippetId });

      if (previousSnippet) {
        utils.snippet.getById.setData({ id: snippetId }, {
          ...previousSnippet,
          messages: previousSnippet.messages.map((m) =>
            m.id === id ? {
              ...m,
              content: content ?? m.content,
              displayMode: displayMode ?? m.displayMode
            } : m
          ),
        });
      }

      setIsEditing(false);
      return { previousSnippet };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSnippet) {
        utils.snippet.getById.setData({ id: snippetId }, context.previousSnippet);
        setEditContent(message.content);
      }
    },
    onSettled: () => {
      void utils.snippet.getById.invalidate({ id: snippetId });
    },
  });

  const deleteMessage = api.message.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.snippet.getById.cancel({ id: snippetId });
      const previousSnippet = utils.snippet.getById.getData({ id: snippetId });

      if (previousSnippet) {
        utils.snippet.getById.setData({ id: snippetId }, {
          ...previousSnippet,
          messages: previousSnippet.messages.filter((m) => m.id !== id),
        });
      }

      return { previousSnippet };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSnippet) {
        utils.snippet.getById.setData({ id: snippetId }, context.previousSnippet);
      }
    },
    onSettled: () => {
      void utils.snippet.getById.invalidate({ id: snippetId });
    },
  });

  const isUser = message.senderType === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    showToast("メッセージをコピーしました");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleDisplayMode = () => {
    const newMode = message.displayMode === "markdown" ? "plain" : "markdown";
    updateMessage.mutate({ id: message.id, displayMode: newMode });
  };

  const startEditing = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      updateMessage.mutate({ id: message.id, content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const bind = useLongPress(() => {
    if (window.innerWidth > 1024) return;
    setIsMenuOpen(true);
  }, {
    threshold: 500,
    cancelOnMovement: true,
  });

  return (
    <div
      className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Message */}
      <div className={`flex-1 max-w-2xl min-w-0 ${isUser ? "text-right" : "text-left"}`}>
        {/* Sender Info */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-orange-100 text-orange-600" : "bg-purple-100 text-purple-600"
              }`}
          >
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
          <div className="text-xs text-gray-400">{message.sender}</div>
        </div>

        {/* Content */}
        <div
          className={`inline-block rounded-2xl px-4 py-3 max-w-full touch-pan-y ${isUser
            ? "bg-transparent border-2 border-orange-200"
            : "bg-transparent border-2 border-purple-200"
            }`}
          {...bind()}
        >
          <div className="text-gray-800 text-left">
            {message.displayMode === "markdown" ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className={`mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? "justify-end" : "justify-start"
            }`}
        >
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="全画面表示"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={handleToggleDisplayMode}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title={message.displayMode === "markdown" ? "プレーンテキストで表示" : "マークダウンで表示"}
          >
            {message.displayMode === "markdown" ? <AlignLeft size={14} /> : <Code size={14} />}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="コピー"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={startEditing}
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

      {/* Action Menu Dialog */}
      <Transition appear show={isMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-9999" onClose={() => setIsMenuOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    メッセージ操作
                  </Dialog.Title>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setIsFullscreen(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                    >
                      <Maximize2 size={20} />
                      全画面表示
                    </button>
                    <button
                      onClick={() => {
                        handleToggleDisplayMode();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                    >
                      {message.displayMode === "markdown" ? <AlignLeft size={20} /> : <Code size={20} />}
                      {message.displayMode === "markdown" ? "プレーンテキストにする" : "マークダウンにする"}
                    </button>
                    <button
                      onClick={() => {
                        handleCopy();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                    >
                      <Copy size={20} />
                      コピー
                    </button>
                    <button
                      onClick={() => {
                        startEditing();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                    >
                      <Edit3 size={20} />
                      編集
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 size={20} />
                      削除
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Dialog */}
      <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-9999" onClose={() => setIsDeleteConfirmOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-2"
                  >
                    メッセージ削除
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      このメッセージを削除してもよろしいですか？この操作は取り消せません。
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors"
                      onClick={() => {
                        deleteMessage.mutate({ id: message.id });
                        setIsDeleteConfirmOpen(false);
                      }}
                    >
                      削除する
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Fullscreen Dialog */}
      <Transition appear show={isFullscreen} as={Fragment}>
        <Dialog as="div" className="relative z-9999" onClose={() => setIsFullscreen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-0 lg:p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full h-full lg:h-[85vh] lg:max-w-5xl transform overflow-hidden bg-white lg:rounded-2xl shadow-xl transition-all flex flex-col">
                  {/* Header Actions */}
                  <div className="flex justify-end items-center gap-2 p-4 border-b border-gray-100 bg-white shrink-0">
                    <button
                      onClick={handleToggleDisplayMode}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                      title={message.displayMode === "markdown" ? "プレーンテキストで表示" : "マークダウンで表示"}
                    >
                      {message.displayMode === "markdown" ? <AlignLeft size={20} /> : <Code size={20} />}
                      <span className="text-sm hidden sm:inline">{message.displayMode === "markdown" ? "プレーンテキスト" : "マークダウン"}</span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="コピー"
                    >
                      {copied ? <Check size={24} /> : <Copy size={24} />}
                    </button>
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="閉じる"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 text-left">
                    <div className="max-w-4xl mx-auto">
                      {message.displayMode === "markdown" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800">{message.content}</div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Dialog */}
      <Transition appear show={isEditing} as={Fragment}>
        <Dialog as="div" className="relative z-9999" onClose={() => setIsEditing(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    メッセージを編集
                  </Dialog.Title>
                  <div className="mt-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[200px] max-h-[50vh] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
                      placeholder="メッセージを入力..."
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                      onClick={() => setIsEditing(false)}
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-100 px-4 py-2 text-sm font-medium text-orange-900 hover:bg-orange-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 transition-colors"
                      onClick={handleSave}
                    >
                      保存する
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
