"use client";

import type { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "確認",
  cancelLabel = "キャンセル",
  confirmVariant = "primary",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass =
    confirmVariant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : "bg-orange-500 hover:bg-orange-600 text-white";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl mx-4">
        {/* Title */}
        <h3
          className={`text-lg font-semibold mb-2 ${
            confirmVariant === "danger" ? "text-red-600" : "text-gray-800"
          }`}
        >
          {title}
        </h3>

        {/* Message */}
        <div className="text-sm text-gray-600 mb-4">{message}</div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${confirmButtonClass}`}
          >
            {loading ? "処理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
