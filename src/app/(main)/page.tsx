import { Sparkles } from "lucide-react";
import { SidebarWrapper } from "~/components/layout/sidebar-wrapper";
import { MainContentWrapper } from "~/components/layout/main-content-wrapper";

export default function DashboardPage() {
  return (
    <>
      <SidebarWrapper />
      <MainContentWrapper>
        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center">
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
              左のサイドバーから新規メモを作成するか、
              <br />
              既存のメモを選択してください。
            </p>
          </div>
        </div>
      </MainContentWrapper>
    </>
  );
}
