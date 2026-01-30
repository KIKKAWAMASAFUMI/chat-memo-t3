import { SidebarWrapper } from "~/components/layout/sidebar-wrapper";
import { MemoContent } from "~/components/layout/memo-content";
import { api, HydrateClient } from "~/trpc/server";

interface MemoPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoPage({ params }: MemoPageProps) {
  const { id } = await params;

  // サーバーサイドでデータをプリフェッチ
  void api.snippet.getById.prefetch({ id });
  void api.snippet.getAll.prefetch();
  void api.tag.getAll.prefetch();
  void api.settings.get.prefetch();

  return (
    <HydrateClient>
      <SidebarWrapper />
      <MemoContent snippetId={id} />
    </HydrateClient>
  );
}
