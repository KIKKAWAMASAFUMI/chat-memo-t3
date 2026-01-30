import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { SidebarWrapper } from "~/components/layout/sidebar-wrapper";
import { api, HydrateClient } from "~/trpc/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Common data prefetch for Sidebar
  void api.snippet.getAll.prefetch();
  void api.tag.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="flex h-screen bg-[#f9f7f2]">
        <SidebarWrapper />
        {children}
      </div>
    </HydrateClient>
  );
}
