import { SidebarWrapper } from "~/components/layout/sidebar-wrapper";
import { MemoContent } from "~/components/layout/memo-content";

interface MemoPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoPage({ params }: MemoPageProps) {
  const { id } = await params;

  return (
    <>
      <SidebarWrapper />
      <MemoContent snippetId={id} />
    </>
  );
}
