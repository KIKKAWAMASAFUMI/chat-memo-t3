"use client";

import { useState, useEffect } from "react";
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
  const updateUserName = api.settings.updateUserName.useMutation({
    onSuccess: () => void utils.settings.get.invalidate(),
  });
  const updateDisplayMode = api.settings.updateDisplayMode.useMutation({
    onSuccess: () => void utils.settings.get.invalidate(),
  });
  const toggleActiveAI = api.aiProvider.toggleActive.useMutation({
    onSuccess: () => void utils.aiProvider.getActiveAIs.invalidate(),
  });
  const addCustomAI = api.settings.addCustomAI.useMutation({
    onSuccess: () => {
      void utils.aiProvider.getAll.invalidate();
      void utils.aiProvider.getActiveAIs.invalidate();
    },
  });
  const removeCustomAI = api.settings.removeCustomAI.useMutation({
    onSuccess: () => {
      void utils.aiProvider.getAll.invalidate();
      void utils.aiProvider.getActiveAIs.invalidate();
    },
  });
  const createTag = api.tag.create.useMutation({
    onSuccess: () => void utils.tag.getAll.invalidate(),
  });
  const deleteTag = api.tag.delete.useMutation({
    onSuccess: () => void utils.tag.getAll.invalidate(),
  });

  // Local state
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [newUserName, setNewUserName] = useState("");
  const [newAIName, setNewAIName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [aiToDelete, setAiToDelete] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  };

  const handleAddAI = () => {
    if (newAIName.trim()) {
      addCustomAI.mutate({ aiName: newAIName.trim() });
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
      removeCustomAI.mutate({ aiName: aiToDelete });
      setAiToDelete(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
    onClose();
  };

  // Derived data
  const allAIs = [
    ...DEFAULT_AI_PRESETS,
    ...(aiProviders?.filter((ai) => !ai.isDefault).map((ai) => ai.name) ?? []),
  ];
  const customAIs = aiProviders?.filter((ai) => !ai.isDefault).map((ai) => ai.name) ?? [];
  const activeAINames = activeAIs?.filter((ai) => ai.isActive).map((ai) => ai.aiProvider.name) ?? [];
  const defaultDisplayMode = settings?.defaultDisplayMode ?? "markdown";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="設定" size="lg">
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
      <div className="flex gap-2 mb-6 border-b border-gray-200 -mt-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "general"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          一般
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "ai"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          AI名管理
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "tags"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          タグ管理
        </button>
        {session?.user && (
          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "account"
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
                  onClick={() => updateDisplayMode.mutate({ displayMode: "markdown" })}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                    defaultDisplayMode === "markdown"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  マークダウン
                </button>
                <button
                  onClick={() => updateDisplayMode.mutate({ displayMode: "plain" })}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                    defaultDisplayMode === "plain"
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

                return (
                  <div
                    key={ai}
                    className={`
                      relative group flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer
                      transition-colors
                      ${isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}
                    `}
                    onClick={() => {
                      if (provider) {
                        toggleActiveAI.mutate({ aiProviderId: provider.id, isActive: !isActive });
                      }
                    }}
                  >
                    <span className="text-sm">{ai}</span>
                    {isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAiToDelete(ai);
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
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full"
                  >
                    <TagIcon size={12} className="text-gray-400" />
                    <span className="text-sm">{tag.name}</span>
                    <button
                      onClick={() => setTagToDelete(tag.name)}
                      className="ml-1 p-0.5 rounded-full hover:bg-red-100 transition-colors"
                      aria-label={`${tag.name}を削除`}
                    >
                      <X size={12} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))
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
                    <p className="text-sm font-medium text-gray-800">
                      {session.user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      ログイン中
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
