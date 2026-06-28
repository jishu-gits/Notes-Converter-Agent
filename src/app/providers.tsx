"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";
import { createQueryClient } from "@/services/query-client";
import { ProviderConfigProvider } from "@/services/provider-config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState<QueryClient>(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ProviderConfigProvider>{children}</ProviderConfigProvider>
      <Toaster
        closeButton
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "border-border/80 bg-card/95 text-card-foreground shadow-elevation-3 backdrop-blur-xl",
            description: "text-muted-foreground",
          },
        }}
      />
    </QueryClientProvider>
  );
}
