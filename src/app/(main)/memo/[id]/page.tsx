import { MemoContent } from "~/components/layout/memo-content";
import { api, HydrateClient } from "~/trpc/server";

interface MemoPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoPage({ params }: MemoPageProps) {
  const { id } = await params;

  // サーバーサイドでデータをプリフェッチ
  void api.snippet.getById.prefetch({ id });
  void api.settings.get.prefetch();

  return (
    <HydrateClient>
      <MemoContent snippetId={id} key={id} />
    </HydrateClient>
  );
}
