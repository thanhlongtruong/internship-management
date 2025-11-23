"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import AuthInitializer from "./auth-initializer";
import { EdgeStoreProvider } from "@/lib/edgestore";
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );
  const pathname = usePathname();
  const noNavRoutes = ["/login", "/register"];
  const showNav = !noNavRoutes.includes(pathname);
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <EdgeStoreProvider>
          {showNav ? (
            <>
              <AuthInitializer />
              {children}
            </>
          ) : (
            children
          )}
        </EdgeStoreProvider>
      </QueryClientProvider>
    </>
  );
}
