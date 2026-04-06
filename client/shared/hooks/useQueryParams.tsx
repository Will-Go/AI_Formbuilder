"use  client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
export default function useQueryParams<T extends string>(queries: T[] = []) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const queryParams = Object.fromEntries(
    queries.map((key) => [key, searchParams.get(key) ?? ""]),
  ) as Record<T, string>;

  const addQueries = (params: Record<string, string>) => {
    // THIS ADDS OR UPDATES THE QUERY PARAMS
    const newParams = new URLSearchParams(searchParams.toString());

    for (const key in params) {
      if (params[key]) {
        newParams.set(key, params[key]);
      } else {
        newParams.delete(key);
      }
    }

    router.push(`${pathname}?${newParams.toString()}`, {
      scroll: false,
    });
  };

  const deleteQueries = (...params: string[]) => {
    // THIS DELETES THE QUERY PARAMS
    const newParams = new URLSearchParams(searchParams.toString());
    for (const key of params) {
      newParams.delete(key);
    }

    router.push(`${pathname}?${newParams.toString()}`, {
      scroll: false,
    });
  };

  const deleteAllQueries = () => {
    // THIS DELETES ALL THE QUERY PARAMS
    deleteQueries(...queries);
  };

  const replaceQueries = (params: Record<string, string>) => {
    // THIS REPLACES THE ENTIRE SEARCH QUERY WITH NEW PARAMS
    const newParams = new URLSearchParams();

    for (const key in params) {
      if (params[key]) {
        newParams.set(key, params[key]);
      }
    }

    router.push(`${pathname}?${newParams.toString()}`, {
      scroll: false,
    });
  };

  return {
    addQueries,
    deleteQueries,
    deleteAllQueries,
    replaceQueries,
    queryParams,
  };
}
