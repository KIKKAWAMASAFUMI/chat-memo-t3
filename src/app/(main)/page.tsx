import { MainContentWrapper } from "~/components/layout/main-content-wrapper";
import { MobileMenuButton } from "~/components/layout/mobile-menu-button";
import { HydrateClient } from "~/trpc/server";
import { WelcomeScreen } from "~/components/dashboard/welcome-screen";

export default async function DashboardPage() {

  return (
    <HydrateClient>
      <MainContentWrapper>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-center gap-3">
          <MobileMenuButton />
          <h1 className="text-lg font-bold text-orange-500 flex-1 text-center lg:text-left">Chat Memo</h1>
        </header>

        {/* Welcome Screen */}
        <WelcomeScreen />
      </MainContentWrapper>
    </HydrateClient>
  );
}
