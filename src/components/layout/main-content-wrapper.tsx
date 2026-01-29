"use client";

export function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[#f9f7f2]">
      {children}
    </main>
  );
}
