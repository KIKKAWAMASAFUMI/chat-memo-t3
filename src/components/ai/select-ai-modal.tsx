"use client";

import { Bot } from "lucide-react";
import { Modal } from "~/components/ui/modal";
import { api } from "~/trpc/react";
import { DEFAULT_AI_PRESETS } from "~/constants";

interface SelectAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (aiName: string) => void;
}

export function SelectAIModal({ isOpen, onClose, onSelect }: SelectAIModalProps) {
  // Fetch active AIs
  const { data: activeAIs } = api.aiProvider.getActiveAIs.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: aiProviders } = api.aiProvider.getAll.useQuery(undefined, {
    enabled: isOpen,
  });

  const handleSelect = (aiName: string) => {
    onSelect(aiName);
    onClose();
  };

  // Get active AI names
  const activeAINames = activeAIs
    ?.filter((ai) => ai.isActive)
    .map((ai) => ai.aiProvider.name) ?? [];

  // If no active AIs configured, use defaults
  const aiList =
    activeAINames.length > 0
      ? activeAINames
      : [...DEFAULT_AI_PRESETS];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AIを選択" size="sm">
      <div className="space-y-2">
        <p className="text-sm text-gray-500 mb-4">
          このメッセージの送信者として設定するAIを選択してください
        </p>
        <div className="space-y-2">
          {aiList.map((ai) => (
            <button
              key={ai}
              onClick={() => handleSelect(ai)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-400 transition-colors"
            >
              <Bot size={20} className="text-orange-500" />
              <span className="text-sm font-medium text-gray-800">{ai}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
