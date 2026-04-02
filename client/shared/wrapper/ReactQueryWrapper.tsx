"use client";

import { ReactNode, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  createIDBPersister,
  PERSIST_CACHE_MAX_AGE,
} from "../offline/persistQueryClientConfig";

const persister = createIDBPersister();

export default function ReactQueryWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // useState ensures a single instance per app lifecycle (prevents recreation)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
            gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cached data for offline use
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_CACHE_MAX_AGE,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
