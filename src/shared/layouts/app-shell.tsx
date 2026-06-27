import * as React from "react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("bg-surface text-foreground min-h-svh", className)}>
      {children}
    </main>
  );
}
