"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";
import { createQueryClient } from "@/services/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState<QueryClient>(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster closeButton richColors position="top-right" />
    </QueryClientProvider>
  );
}
