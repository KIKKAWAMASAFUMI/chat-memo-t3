import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-[#f9f7f2]">
      {children}
    </div>
  );
}
