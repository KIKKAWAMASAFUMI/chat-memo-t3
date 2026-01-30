"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "~/components/layout/sidebar-context";

export function MobileMenuButton() {
  const { open: openSidebar } = useSidebar();

  return (
    <button
      onClick={openSidebar}
      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="メニューを開く"
    >
      <Menu size={24} />
    </button>
  );
}
