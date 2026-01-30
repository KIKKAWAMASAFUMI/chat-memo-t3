"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "~/components/ui/toast";
import { SidebarProvider } from "~/components/layout/sidebar-context";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
