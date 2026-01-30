"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "~/components/ui/modal";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";
import { useSidebar } from "~/components/layout/sidebar-context";

interface CreateSnippetModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateSnippetModal({ isOpen, onClose }: CreateSnippetModalProps) {
    const router = useRouter();
    const { close: closeSidebar } = useSidebar();
    const [title, setTitle] = useState("");
    const [placeholder, setPlaceholder] = useState("");

    const utils = api.useUtils();

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            // Format: YYYY/MM/DD HH:mm
            const formatted = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setPlaceholder(formatted);
            setTitle("");
        }
    }, [isOpen]);

    const createSnippet = api.snippet.create.useMutation({
        onSuccess: (data) => {
            void utils.snippet.getAll.invalidate();
            router.push(`/memo/${data.id}`);
            closeSidebar();
            onClose();
        },
    });

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const submitTitle = title.trim() || placeholder;
        createSnippet.mutate({ title: submitTitle });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="新規メモ作成">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        タイトル
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        空欄の場合は現在の日時がタイトルになります
                    </p>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        type="submit"
                        disabled={createSnippet.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                        {createSnippet.isPending && <Loader2 size={16} className="animate-spin" />}
                        作成
                    </button>
                </div>
            </form>
        </Modal>
    );
}
