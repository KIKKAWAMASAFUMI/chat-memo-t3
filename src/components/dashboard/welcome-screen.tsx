"use client";

import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { CreateSnippetModal } from "~/components/snippet/create-snippet-modal";

export function WelcomeScreen() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-500 to-purple-500 rounded-2xl mb-6 shadow-lg">
                    <Sparkles size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Chat Memo へようこそ
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                    AIとの会話を美しく保存し、いつでも再利用できるスクラップブック。
                </p>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-full shadow-md hover:bg-orange-600 transition-all hover:shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    新規メモを追加
                </button>

                <CreateSnippetModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </div>
    );
}
