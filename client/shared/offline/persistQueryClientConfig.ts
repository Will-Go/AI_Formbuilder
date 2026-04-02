import { get, set, del } from "idb-keyval";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

const IDB_KEY = "formia-react-query-cache";

/** IDB-based persister for @tanstack/react-query-persist-client */
export function createIDBPersister() {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(IDB_KEY, client);
    },
    restoreClient: async (): Promise<PersistedClient | undefined> => {
      return await get<PersistedClient>(IDB_KEY);
    },
    removeClient: async () => {
      await del(IDB_KEY);
    },
  };
}

/** Max age for the persisted cache: 24 hours */
export const PERSIST_CACHE_MAX_AGE = 1000 * 60 * 60 * 24;
