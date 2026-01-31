"use client";

import { useState, useEffect } from "react";
import { Plus, X, Tag } from "lucide-react";
import { Modal } from "~/components/ui/modal";
import { api } from "~/trpc/react";
import { MAX_TAGS, MAX_TAG_NAME_LENGTH } from "~/constants";

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippetId: string;
}

const MAX_TAGS_PER_SNIPPET = 4;

export function TagModal({ isOpen, onClose, snippetId }: TagModalProps) {
  const utils = api.useUtils();

  // Fetch all tags and current snippet's tags
  const { data: allTags } = api.tag.getAll.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: snippetTags } = api.tag.getForSnippet.useQuery(
    { snippetId },
    { enabled: isOpen && !!snippetId }
  );

  // Mutations
  const createTag = api.tag.create.useMutation({
    onSuccess: () => void utils.tag.getAll.invalidate(),
  });
  const addTagToSnippet = api.tag.addToSnippet.useMutation({
    onSuccess: () => {
      void utils.tag.getForSnippet.invalidate({ snippetId });
      void utils.snippet.getAll.invalidate();
      void utils.snippet.getById.invalidate({ id: snippetId });
    },
  });
  const removeTagFromSnippet = api.tag.removeFromSnippet.useMutation({
    onSuccess: () => {
      void utils.tag.getForSnippet.invalidate({ snippetId });
      void utils.snippet.getAll.invalidate();
      void utils.snippet.getById.invalidate({ id: snippetId });
    },
  });

  // Local state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");

  // Sync selectedTagIds when snippetTags changes
  useEffect(() => {
    if (snippetTags) {
      setSelectedTagIds(snippetTags.map((t) => t.id));
    }
  }, [snippetTags]);

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      // Remove tag from snippet
      removeTagFromSnippet.mutate({ snippetId, tagId });
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else if (selectedTagIds.length < MAX_TAGS_PER_SNIPPET) {
      // Add tag to snippet
      addTagToSnippet.mutate({ snippetId, tagId });
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleAddNewTag = async () => {
    const trimmed = newTagName.trim();
    if (trimmed && allTags && !allTags.some((t) => t.name === trimmed) && allTags.length < MAX_TAGS) {
      const newTag = await createTag.mutateAsync({ name: trimmed });
      if (selectedTagIds.length < MAX_TAGS_PER_SNIPPET) {
        addTagToSnippet.mutate({ snippetId, tagId: newTag.id });
        setSelectedTagIds([...selectedTagIds, newTag.id]);
      }
      setNewTagName("");
    }
  };

  const selectedTags = allTags?.filter((t) => selectedTagIds.includes(t.id)) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="タグを編集" size="md">
      <div className="space-y-4">
        {/* Selected Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            選択中のタグ（{selectedTags.length}/{MAX_TAGS_PER_SNIPPET}）
          </label>
          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-lg">
            {selectedTags.length === 0 ? (
              <span className="text-sm text-gray-400">タグが選択されていません</span>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-orange-500 text-white rounded-full"
                >
                  #{tag.name}
                  <button
                    onClick={() => handleToggleTag(tag.id)}
                    className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label={`${tag.name}を削除`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Available Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            利用可能なタグ
          </label>
          <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-3 bg-white border border-gray-200 rounded-lg">
            {!allTags || allTags.length === 0 ? (
              <span className="text-sm text-gray-400">タグがありません</span>
            ) : (
              allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    disabled={!isSelected && selectedTagIds.length >= MAX_TAGS_PER_SNIPPET}
                    className={`
                      inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full
                      transition-colors
                      ${isSelected
                        ? "bg-orange-100 text-orange-600 border border-orange-400"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <Tag size={12} />
                    {tag.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Add New Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            新しいタグを作成
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddNewTag();
                }
              }}
              placeholder="タグ名を入力..."
              maxLength={MAX_TAG_NAME_LENGTH}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleAddNewTag}
              disabled={!newTagName.trim() || (allTags?.length ?? 0) >= MAX_TAGS}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
              追加
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            全体で最大{MAX_TAGS}個まで（残り: {Math.max(0, MAX_TAGS - (allTags?.length ?? 0))}）
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </Modal>
  );
}
