"use client";

import { Sparkles, Menu } from "lucide-react";
import { SidebarWrapper } from "~/components/layout/sidebar-wrapper";
import { MainContentWrapper } from "~/components/layout/main-content-wrapper";
import { useSidebar } from "~/components/layout/sidebar-context";

export default function DashboardPage() {
  const { open: openSidebar } = useSidebar();

  return (
    <>
      <SidebarWrapper />
      <MainContentWrapper>
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 lg:hidden">
          <button
            onClick={openSidebar}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="メニューを開く"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-orange-500">Chat Memo</h1>
        </header>

        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-purple-500 rounded-2xl mb-6 shadow-lg">
              <Sparkles size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Chat Memo へようこそ
            </h2>
            <p className="text-gray-500 leading-relaxed">
              AIとの会話を美しく保存し、いつでも再利用できるスクラップブック。
              <br />
              <span className="hidden lg:inline">左のサイドバーから</span>
              <span className="lg:hidden">メニューから</span>
              新規メモを作成するか、
              <br />
              既存のメモを選択してください。
            </p>
          </div>
        </div>
      </MainContentWrapper>
    </>
  );
}
