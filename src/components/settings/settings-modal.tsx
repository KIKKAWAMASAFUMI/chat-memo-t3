"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Tag as TagIcon, AlertTriangle, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Modal } from "~/components/ui/modal";

import { api } from "~/trpc/react";
import {
  DEFAULT_AI_PRESETS,
  MAX_CUSTOM_AIS,
  MAX_TAGS,
  MAX_USERNAME_LENGTH,
  MAX_TAG_NAME_LENGTH,
  MAX_AI_NAME_LENGTH,
} from "~/constants";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "general" | "ai" | "tags" | "account";

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // Fetch settings and tags
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: tags } = api.tag.getAll.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: aiProviders } = api.aiProvider.getAll.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: activeAIs } = api.aiProvider.getActiveAIs.useQuery(undefined, {
    enabled: isOpen,
  });

  // Mutations
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateUserName = api.settings.updateUserName.useMutation({
    onSuccess: () => {
      void utils.settings.get.invalidate();
    },
    onError: (error) => {
      showNotification(`保存に失敗しました: ${error.message}`);
    },
  });



  const updateDisplayMode = api.settings.updateDisplayMode.useMutation({
    onMutate: async (newSettings) => {
      await utils.settings.get.cancel();
      const previousSettings = utils.settings.get.getData();

      utils.settings.get.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          defaultDisplayMode: newSettings.displayMode,
        };
      });

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      utils.settings.get.setData(undefined, context?.previousSettings);
      showNotification("表示モードの変更に失敗しました");
    },
    onSettled: () => {
      void utils.settings.get.invalidate();
    },
  });
  const toggleActiveAI = api.aiProvider.toggleActive.useMutation({
    onMutate: async ({ aiProviderId, isActive }) => {
      await utils.aiProvider.getActiveAIs.cancel();
      const previousActiveAIs = utils.aiProvider.getActiveAIs.getData();

      utils.aiProvider.getActiveAIs.setData(undefined, (old) => {
        if (!old) return [];

        const newActiveAIs = [...old];
        const existingIndex = newActiveAIs.findIndex(
          (ai) => ai.aiProviderId === aiProviderId
        );

        if (existingIndex !== -1) {
          const existing = newActiveAIs[existingIndex];
          if (existing) {
            newActiveAIs[existingIndex] = { ...existing, isActive };
          }
        } else if (isActive) {
          const provider = aiProviders?.find(p => p.id === aiProviderId);
          if (provider) {
            newActiveAIs.push({
              id: `temp-${Date.now()}`,
              userId: session?.user?.id ?? "temp-user",
              aiProviderId,
              isActive: true,
              createdAt: new Date(),
              aiProvider: provider,
            });
          }
        }

        return newActiveAIs;
      });

      return { previousActiveAIs };
    },
    onError: (_err, _newActiveAI, context) => {
      utils.aiProvider.getActiveAIs.setData(
        undefined,
        context?.previousActiveAIs
      );
      showNotification("AI設定の変更に失敗しました");
    },
    onSettled: () => {
      void utils.aiProvider.getActiveAIs.invalidate();
    },
  });
  const addCustomAI = api.aiProvider.createCustom.useMutation({
    onMutate: async ({ name }) => {
      await utils.aiProvider.getAll.cancel();
      const previousProviders = utils.aiProvider.getAll.getData();

      utils.aiProvider.getAll.setData(undefined, (old) => {
        if (!old) return [];
        return [
          ...old,
          {
            id: `temp-${Date.now()}`,
            name,
            icon: "bot",
            isDefault: false,
            userId: session?.user?.id ?? "temp-user",
            createdAt: new Date(),
          },
        ];
      });

      return { previousProviders };
    },
    onError: (_err, _newAI, context) => {
      utils.aiProvider.getAll.setData(undefined, context?.previousProviders);
      showNotification("AIの追加に失敗しました");
    },
    onSettled: () => {
      void utils.aiProvider.getAll.invalidate();
      void utils.aiProvider.getActiveAIs.invalidate();
    },
  });
  const removeCustomAI = api.aiProvider.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.aiProvider.getAll.cancel();
      const previousProviders = utils.aiProvider.getAll.getData();

      utils.aiProvider.getAll.setData(undefined, (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== id);
      });

      // Also update activeAIs to remove the deleted one instantly from active list
      await utils.aiProvider.getActiveAIs.cancel();
      const previousActiveAIs = utils.aiProvider.getActiveAIs.getData();

      utils.aiProvider.getActiveAIs.setData(undefined, (old) => {
        if (!old) return [];
        return old.filter((active) => active.aiProviderId !== id);
      });

      return { previousProviders, previousActiveAIs };
    },
    onError: (_err, _variables, context) => {
      utils.aiProvider.getAll.setData(undefined, context?.previousProviders);
      utils.aiProvider.getActiveAIs.setData(undefined, context?.previousActiveAIs);
      showNotification("AIの削除に失敗しました");
    },
    onSettled: () => {
      void utils.aiProvider.getAll.invalidate();
      void utils.aiProvider.getActiveAIs.invalidate();
    },
  });

  const updateAI = api.aiProvider.update.useMutation({
    onMutate: async ({ id, name }) => {
      await utils.aiProvider.getAll.cancel();
      const previousProviders = utils.aiProvider.getAll.getData();

      utils.aiProvider.getAll.setData(undefined, (old) => {
        if (!old) return [];
        return old.map((p) => (p.id === id ? { ...p, name } : p));
      });

      await utils.aiProvider.getActiveAIs.cancel();
      const previousActiveAIs = utils.aiProvider.getActiveAIs.getData();

      utils.aiProvider.getActiveAIs.setData(undefined, (old) => {
        if (!old) return [];
        return old.map(r => r.aiProviderId === id ? { ...r, aiProvider: { ...r.aiProvider, name } } : r);
      });

      return { previousProviders, previousActiveAIs };
    },
    onError: (_err, _vars, ctx) => {
      utils.aiProvider.getAll.setData(undefined, ctx?.previousProviders);
      utils.aiProvider.getActiveAIs.setData(undefined, ctx?.previousActiveAIs);
      showNotification("AI名の変更に失敗しました");
    },
    onSettled: () => {
      void utils.aiProvider.getAll.invalidate();
      void utils.aiProvider.getActiveAIs.invalidate();
    },
  });

  const updateTag = api.tag.update.useMutation({
    onMutate: async ({ id, name }) => {
      await utils.tag.getAll.cancel();
      const previousTags = utils.tag.getAll.getData();

      utils.tag.getAll.setData(undefined, (old) => {
        if (!old) return [];
        return old.map((t) => (t.id === id ? { ...t, name: name ?? t.name } : t));
      });

      return { previousTags };
    },
    onError: (_err, _vars, ctx) => {
      utils.tag.getAll.setData(undefined, ctx?.previousTags);
      showNotification("タグ名の変更に失敗しました");
    },
    onSettled: () => {
      void utils.tag.getAll.invalidate();
      void utils.snippet.getAll.invalidate();
      void utils.snippet.getById.invalidate();
    },
  });

  const ensureDefaults = api.aiProvider.ensureDefaults.useMutation({
    onSuccess: () => void utils.aiProvider.getAll.invalidate(),
  });

  // Ensure default AIs exist when modal opens
  useEffect(() => {
    if (isOpen) {
      ensureDefaults.mutate();
    }
  }, [isOpen]);
  const createTag = api.tag.create.useMutation({
    onSuccess: () => {
      void utils.tag.getAll.invalidate();
      void utils.snippet.getAll.invalidate();
    },
  });
  const deleteTag = api.tag.delete.useMutation({
    onSuccess: () => {
      void utils.tag.getAll.invalidate();
      void utils.snippet.getAll.invalidate();
    },
    onError: (error) => {
      showNotification(`タグの削除に失敗しました: ${error.message}`);
    },
  });

  // Local state
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [newUserName, setNewUserName] = useState("");
  const [newAIName, setNewAIName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [aiToDelete, setAiToDelete] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit states
  const [editingAIId, setEditingAIId] = useState<string | null>(null);
  const [editingAIText, setEditingAIText] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagText, setEditingTagText] = useState("");

  // Long press logic
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const startPress = (id: string, type: "ai" | "tag", initialText: string) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (type === "ai") {
        setEditingAIId(id);
        setEditingAIText(initialText);
      } else {
        setEditingTagId(id);
        setEditingTagText(initialText);
      }
    }, 600);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (action: () => void) => {
    if (!isLongPressRef.current) {
      action();
    }
  };

  const saveAIEdit = () => {
    if (editingAIId && editingAIText.trim()) {
      updateAI.mutate({ id: editingAIId, name: editingAIText.trim() });
      setEditingAIId(null);
    } else {
      setEditingAIId(null);
    }
  };

  const saveTagEdit = () => {
    if (editingTagId && editingTagText.trim()) {
      updateTag.mutate({ id: editingTagId, name: editingTagText.trim() });
      setEditingTagId(null);
    } else {
      setEditingTagId(null);
    }
  };

  // Sync settings to local state
  useEffect(() => {
    if (settings?.userName) {
      setNewUserName(settings.userName);
    }
  }, [settings?.userName]);

  // Handlers
  const handleSaveUserName = () => {
    const nameToSave = newUserName.trim() || "あなた";
    updateUserName.mutate({ userName: nameToSave });
    setNewUserName(nameToSave);
    showNotification("ユーザー名を保存しました");
  };

  const handleUpdateDisplayMode = (mode: "markdown" | "plain") => {
    updateDisplayMode.mutate({ displayMode: mode });
    showNotification("表示モードを変更しました");
  };

  const handleAddAI = () => {
    if (newAIName.trim()) {
      addCustomAI.mutate({ name: newAIName.trim() });
      setNewAIName("");
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      createTag.mutate({ name: newTagName.trim() });
      setNewTagName("");
    }
  };

  const confirmDeleteTag = () => {
    if (tagToDelete) {
      const tag = tags?.find((t) => t.name === tagToDelete);
      if (tag) {
        deleteTag.mutate({ id: tag.id });
      }
      setTagToDelete(null);
    }
  };

  const confirmDeleteAI = () => {
    if (aiToDelete) {
      const provider = aiProviders?.find((p) => p.name === aiToDelete);
      if (provider) {
        removeCustomAI.mutate({ id: provider.id });
      }
      setAiToDelete(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
    onClose();
  };

  // Derived data
  const allAIs = aiProviders?.map((ai) => ai.name) ?? [];
  const customAIs = aiProviders?.filter((ai) => !ai.isDefault).map((ai) => ai.name) ?? [];
  const activeAINames = activeAIs?.filter((ai) => ai.isActive).map((ai) => ai.aiProvider.name) ?? [];
  const defaultDisplayMode = settings?.defaultDisplayMode ?? "markdown";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="設定" size="lg">
      {/* Notification Overlay */}
      {notification && (
        <div className="absolute top-16 left-0 right-0 z-50 flex justify-center pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className="bg-gray-800/95 text-white text-sm font-medium px-6 py-2 rounded-full shadow-xl backdrop-blur-sm border border-white/10">
            {notification}
          </div>
        </div>
      )}

      {/* Tag Delete Confirmation */}
      {tagToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px] rounded-2xl">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border border-gray-200">
            <h4 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} />
              タグの削除
            </h4>
            <p className="text-sm text-gray-800 mb-4 leading-relaxed">
              タグ「<span className="font-bold">{tagToDelete}</span>」を削除しますか？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTagToDelete(null)}
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDeleteTag}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Delete Confirmation */}
      {aiToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px] rounded-2xl">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border border-gray-200">
            <h4 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} />
              AI名の削除
            </h4>
            <p className="text-sm text-gray-800 mb-4 leading-relaxed">
              AI名「<span className="font-bold">{aiToDelete}</span>」を削除しますか？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAiToDelete(null)}
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDeleteAI}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 -mt-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap shrink-0 ${activeTab === "general"
            ? "border-orange-500 text-orange-500"
            : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
        >
          一般
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap shrink-0 ${activeTab === "ai"
            ? "border-orange-500 text-orange-500"
            : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
        >
          AI名管理
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap shrink-0 ${activeTab === "tags"
            ? "border-orange-500 text-orange-500"
            : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
        >
          タグ管理
        </button>
        {session?.user && (
          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap shrink-0 ${activeTab === "account"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
          >
            アカウント
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                ユーザー名
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="あなたの名前"
                  maxLength={MAX_USERNAME_LENGTH}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleSaveUserName}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                デフォルト表示モード
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateDisplayMode("markdown")}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${defaultDisplayMode === "markdown"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  マークダウン
                </button>
                <button
                  onClick={() => handleUpdateDisplayMode("plain")}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${defaultDisplayMode === "plain"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  プレーン
                </button>
              </div>
            </div>
          </>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              AI名の管理
            </label>
            <p className="text-xs text-gray-500 mb-3">
              メッセージ送信時に選択できるAI名を管理します。クリックで有効/無効を切替。
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {allAIs.map((ai) => {
                const isActive = activeAINames.includes(ai);
                const isCustom = customAIs.includes(ai);
                const provider = aiProviders?.find((p) => p.name === ai);
                const isEditing = editingAIId === provider?.id;

                if (isEditing) {
                  return (
                    <div key={ai} className="relative">
                      <input
                        autoFocus
                        type="text"
                        value={editingAIText}
                        onChange={(e) => setEditingAIText(e.target.value)}
                        onBlur={saveAIEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveAIEdit();
                          if (e.key === "Escape") setEditingAIId(null);
                        }}
                        className="px-3 py-1.5 text-sm border border-orange-500 rounded-full focus:outline-none w-[120px]"
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={ai}
                    className={`
                      relative group flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer select-none
                      transition-colors
                      ${isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}
                    `}
                    onMouseDown={() => isCustom && provider && startPress(provider.id, "ai", ai)}
                    onMouseUp={cancelPress}
                    onMouseLeave={cancelPress}
                    onTouchStart={() => isCustom && provider && startPress(provider.id, "ai", ai)}
                    onTouchEnd={cancelPress}
                    onClick={() =>
                      handleClick(() => {
                        if (!provider) return;

                        if (isActive && activeAINames.length <= 1) {
                          showNotification("最低一つの名前を選択しておく必要があります");
                          return;
                        }

                        toggleActiveAI.mutate({
                          aiProviderId: provider.id,
                          isActive: !isActive,
                        });
                      })
                    }
                  >
                    <span className="text-sm">{ai}</span>
                    {isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Prevent delete when long pressing or just editing
                          if (!isLongPressRef.current) setAiToDelete(ai);
                        }}
                        className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                        aria-label={`${ai}を削除`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newAIName}
                onChange={(e) => setNewAIName(e.target.value)}
                placeholder="カスタムAI名を追加..."
                maxLength={MAX_AI_NAME_LENGTH}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleAddAI}
                disabled={!newAIName.trim() || customAIs.length >= MAX_CUSTOM_AIS}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
                追加
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              最大{MAX_CUSTOM_AIS}個まで追加可能（残り: {Math.max(0, MAX_CUSTOM_AIS - customAIs.length)}）
            </p>
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === "tags" && (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              登録済みタグ
            </label>
            <p className="text-xs text-gray-500 mb-3">
              全スニペットで使用できるタグを管理します（最大{MAX_TAGS}個）。
            </p>

            <div className="flex flex-wrap gap-2 mb-3 max-h-[200px] overflow-y-auto p-3 bg-gray-50 rounded-lg">
              {!tags || tags.length === 0 ? (
                <span className="text-sm text-gray-500">まだタグがありません</span>
              ) : (
                tags.map((tag) => {
                  const isEditing = editingTagId === tag.id;
                  if (isEditing) {
                    return (
                      <div key={tag.id} className="relative">
                        <input
                          autoFocus
                          type="text"
                          value={editingTagText}
                          onChange={(e) => setEditingTagText(e.target.value)}
                          onBlur={saveTagEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveTagEdit();
                            if (e.key === "Escape") setEditingTagId(null);
                          }}
                          className="px-3 py-1.5 text-sm border border-orange-500 rounded-full focus:outline-none w-[100px]"
                        />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full cursor-pointer select-none"
                      onMouseDown={() => startPress(tag.id, "tag", tag.name)}
                      onMouseUp={cancelPress}
                      onMouseLeave={cancelPress}
                      onTouchStart={() => startPress(tag.id, "tag", tag.name)}
                      onTouchEnd={cancelPress}
                      onClick={() => handleClick(() => { /* No click action for tags currently, or maybe select? */ })}
                    >
                      <TagIcon size={12} className="text-gray-400" />
                      <span className="text-sm">{tag.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLongPressRef.current) setTagToDelete(tag.name);
                        }}
                        className="ml-1 p-0.5 rounded-full hover:bg-red-100 transition-colors"
                        aria-label={`${tag.name}を削除`}
                      >
                        <X size={12} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="タグを追加..."
                maxLength={MAX_TAG_NAME_LENGTH}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim() || (tags?.length ?? 0) >= MAX_TAGS}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
                追加
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              最大{MAX_TAGS}個まで追加可能（残り: {Math.max(0, MAX_TAGS - (tags?.length ?? 0))}）
            </p>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && session?.user && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-4">アカウント情報</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {session.user.name || "ユーザー"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-2">ログアウト</h3>
              <p className="text-xs text-gray-500 mb-3">
                ログアウトすると、再度ログインが必要になります。
              </p>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                {isLoggingOut ? "ログアウト中..." : "ログアウト"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
