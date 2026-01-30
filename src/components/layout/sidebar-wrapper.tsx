"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Plus,
  Search,
  Settings,
  LogOut,
  X,
  Hash,
  MoreVertical,
} from "lucide-react";
import { api } from "~/trpc/react";
import { SettingsModal } from "~/components/settings/settings-modal";
import { TagModal } from "~/components/tag/tag-modal";
import { useSidebar } from "~/components/layout/sidebar-context";
import { SnippetListSkeleton } from "~/components/ui/skeleton";

export function SidebarWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, close, toggle } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tagModalSnippetId, setTagModalSnippetId] = useState<string | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Long press logic refs
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = useRef(false);

  const utils = api.useUtils();

  // Get current snippet ID from URL
  const currentSnippetId = pathname?.startsWith("/memo/")
    ? pathname.split("/")[2]
    : null;

  // Fetch snippets
  const { data: snippets, isLoading } = api.snippet.getAll.useQuery();
  const { data: allTags } = api.tag.getAll.useQuery();

  const createSnippet = api.snippet.create.useMutation({
    onSuccess: (data) => {
      void utils.snippet.getAll.invalidate();
      router.push(`/memo/${data.id}`);
      close(); // Close sidebar on mobile after creating
    },
  });

  const deleteSnippet = api.snippet.delete.useMutation({
    onSuccess: () => {
      void utils.snippet.getAll.invalidate();
      if (currentSnippetId) {
        router.push("/");
      }
    },
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpenId]);

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    if (tagDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [tagDropdownOpen]);

  // Filter snippets based on search and tags
  const filteredSnippets = snippets?.filter((snippet) => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags =
      selectedTagIds.length === 0 ||
      selectedTagIds.some((tagId) => snippet.tags.some((t) => t.tagId === tagId));
    return matchesSearch && matchesTags;
  });

  const handleCreateNew = () => {
    createSnippet.mutate({ title: "新規メモ" });
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleDelete = (id: string) => {
    if (confirm("このメモを削除しますか？")) {
      deleteSnippet.mutate({ id });
    }
    setMenuOpenId(null);
  };

  const handleTagSelect = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const clearTagFilter = () => {
    setSelectedTagIds([]);
  };

  const handleSelectSnippet = (id: string) => {
    if (!isTouchRef.current) {
      router.push(`/memo/${id}`);
      close(); // Close sidebar on mobile after selecting
    }
  };

  // Long Press Logic for mobile
  const startLongPress = (id: string) => {
    longPressTimerRef.current = setTimeout(() => {
      isTouchRef.current = true;
      setMenuOpenId(id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const endLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setTimeout(() => {
      isTouchRef.current = false;
    }, 100);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-lg font-bold text-orange-500">Chat Memo</h1>
          <button
            onClick={close}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            aria-label="サイドバーを閉じる"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* New Button */}
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

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative" ref={tagDropdownRef}>
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="メモを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTagDropdownOpen(!tagDropdownOpen);
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                selectedTagIds.length > 0
                  ? "bg-orange-100 text-orange-500"
                  : "hover:bg-gray-100 text-gray-400"
              }`}
              aria-label="タグで検索"
            >
              <Hash size={16} />
            </button>

            {/* Tag Dropdown */}
            {tagDropdownOpen && allTags && allTags.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {selectedTagIds.length > 0 && (
                  <button
                    onClick={clearTagFilter}
                    className="w-full px-3 py-2 text-left text-sm text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-2 border-b border-gray-100"
                  >
                    <X size={14} />
                    フィルターをクリア
                  </button>
                )}
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag.id)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                      selectedTagIds.includes(tag.id)
                        ? "bg-orange-50 text-orange-600"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Hash size={14} />
                    <span>{tag.name}</span>
                    {selectedTagIds.includes(tag.id) && (
                      <span className="ml-auto text-orange-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Tag Badges */}
          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTagIds.map((tagId) => {
                const tag = allTags?.find((t) => t.id === tagId);
                return tag ? (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full"
                  >
                    #{tag.name}
                    <button
                      onClick={() => handleTagSelect(tagId)}
                      className="hover:bg-orange-200 rounded-full"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Snippet List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <SnippetListSkeleton />
          ) : filteredSnippets?.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {searchQuery || selectedTagIds.length > 0 ? "検索結果がありません" : "メモがありません"}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredSnippets?.map((snippet) => (
                <div
                  key={snippet.id}
                  className={`
                    group relative p-3 rounded-lg cursor-pointer
                    transition-all duration-200 select-none
                    ${
                      currentSnippetId === snippet.id
                        ? "bg-orange-50 border-l-4 border-orange-500"
                        : "hover:bg-gray-50"
                    }
                    ${menuOpenId === snippet.id ? "scale-[1.02] shadow-lg z-10" : ""}
                  `}
                  onClick={() => handleSelectSnippet(snippet.id)}
                  onTouchStart={() => startLongPress(snippet.id)}
                  onTouchEnd={endLongPress}
                  onContextMenu={(e) => {
                    if (isTouchRef.current) e.preventDefault();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {snippet.title}
                      </div>
                      {snippet.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {snippet.tags.map((st) => (
                            <span
                              key={st.tagId}
                              className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded"
                            >
                              {st.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(snippet.updatedAt).toLocaleDateString("ja-JP")}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === snippet.id ? null : snippet.id);
                      }}
                      className="hidden lg:block p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                      aria-label="メニュー"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {menuOpenId === snippet.id && (
                    <div
                      className="absolute right-2 top-10 z-10 w-32 py-1 bg-white rounded-lg shadow-lg border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setTagModalSnippetId(snippet.id);
                          setMenuOpenId(null);
                        }}
                      >
                        タグを編集
                      </button>
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(snippet.id)}
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setSettingsOpen(true)}
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
        </div>
      </aside>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Tag Modal */}
      {tagModalSnippetId && (
        <TagModal
          isOpen={!!tagModalSnippetId}
          onClose={() => setTagModalSnippetId(null)}
          snippetId={tagModalSnippetId}
        />
      )}
    </>
  );
}
