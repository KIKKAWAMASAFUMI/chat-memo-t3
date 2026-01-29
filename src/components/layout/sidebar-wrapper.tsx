"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Plus,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { api } from "~/trpc/react";

export function SidebarWrapper() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: snippets, isLoading } = api.snippet.getAll.useQuery();
  const createSnippet = api.snippet.create.useMutation({
    onSuccess: (data) => {
      router.push(`/memo/${data.id}`);
    },
  });

  const filteredSnippets = snippets?.filter((snippet) =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    createSnippet.mutate({ title: "新規メモ" });
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside
      className={`${
        isOpen ? "w-80" : "w-16"
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {isOpen && (
          <h1 className="text-lg font-bold text-gray-800">Chat Memo</h1>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* New Button */}
      {isOpen && (
        <div className="p-4">
          <button
            onClick={handleCreateNew}
            disabled={createSnippet.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Plus size={20} />
            新規メモ
          </button>
        </div>
      )}

      {/* Search */}
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="メモを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Snippet List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-400">読み込み中...</div>
        ) : filteredSnippets?.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {isOpen ? "メモがありません" : ""}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredSnippets?.map((snippet) => (
              <button
                key={snippet.id}
                onClick={() => router.push(`/memo/${snippet.id}`)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                {isOpen ? (
                  <>
                    <div className="font-medium text-gray-800 truncate">
                      {snippet.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(snippet.updatedAt).toLocaleDateString("ja-JP")}
                    </div>
                  </>
                ) : (
                  <MessageSquare size={20} className="mx-auto text-gray-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {isOpen ? (
          <>
            <button
              onClick={() => {/* TODO: Open settings modal */}}
              className="w-full flex items-center gap-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} />
              設定
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              ログアウト
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {/* TODO: Open settings modal */}}
              className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
