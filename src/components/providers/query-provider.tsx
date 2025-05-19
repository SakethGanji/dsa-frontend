"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { queryClient } from "@/lib/queryClient"; // Import the centralized queryClient

export function QueryProvider({ children }: { children: ReactNode }) {
  // Remove useState and local QueryClient instantiation
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

