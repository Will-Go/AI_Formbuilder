import { useState, useEffect, useCallback } from "react";

type StorageValue = string | number | boolean | object | null;

interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T) => StorageResult<T>;
  removeValue: () => StorageResult<boolean>;
  error: string | null;
  loading: boolean;
}

// Utility functions
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

const handleError = <T>(
  operation: string,
  error: unknown,
): StorageResult<T> => {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.warn(`LocalStorage ${operation} failed:`, errorMessage);
  return { success: false, error: errorMessage };
};

// Main hook for localStorage
export function useLocalStorage<T extends StorageValue>(
  key: string,
  initialValue?: T,
): UseLocalStorageReturn<T> {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize value from localStorage
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      setError("localStorage is not available");
      setLoading(false);
      return;
    }

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        try {
          const parsedValue = JSON.parse(item) as T;
          setValue(parsedValue);
        } catch {
          setValue(item as T);
        }
      } else if (initialValue !== undefined) {
        setValue(initialValue);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [key, initialValue]);

  const setStoredValue = useCallback(
    (newValue: T): StorageResult<T> => {
      if (!isLocalStorageAvailable()) {
        const result = handleError(
          "set",
          new Error("localStorage is not available"),
        );
        setError(result.error || null);
        return result as StorageResult<T>;
      }

      try {
        const serializedValue =
          typeof newValue === "string" ? newValue : JSON.stringify(newValue);
        localStorage.setItem(key, serializedValue);
        setValue(newValue);
        setError(null);
        return { success: true, data: newValue };
      } catch (err) {
        const result = handleError("set", err);
        setError(result.error || null);
        return result as StorageResult<T>;
      }
    },
    [key],
  );

  const removeStoredValue = useCallback((): StorageResult<boolean> => {
    if (!isLocalStorageAvailable()) {
      const result = handleError(
        "remove",
        new Error("localStorage is not available"),
      );
      setError(result.error || null);
      return result as StorageResult<boolean>;
    }

    try {
      localStorage.removeItem(key);
      setValue(null);
      setError(null);
      return { success: true, data: true };
    } catch (err) {
      const result = handleError("remove", err);
      setError(result.error || null);
      return result as StorageResult<boolean>;
    }
  }, [key]);

  return {
    value,
    setValue: setStoredValue,
    removeValue: removeStoredValue,
    error,
    loading,
  };
}

// Additional utility hooks for specific types
export function useLocalStorageString(key: string, initialValue?: string) {
  return useLocalStorage<string>(key, initialValue);
}

export function useLocalStorageNumber(key: string, initialValue?: number) {
  return useLocalStorage<number>(key, initialValue);
}

export function useLocalStorageBoolean(key: string, initialValue?: boolean) {
  return useLocalStorage<boolean>(key, initialValue);
}

export function useLocalStorageObject<T extends object>(
  key: string,
  initialValue?: T,
) {
  return useLocalStorage<T>(key, initialValue);
}

// Utility functions for one-off operations (non-reactive)
export const localStorageUtils = {
  set<T extends StorageValue>(key: string, value: T): StorageResult<T> {
    if (!isLocalStorageAvailable()) {
      return handleError("set", new Error("localStorage is not available"));
    }

    try {
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return { success: true, data: value };
    } catch (error) {
      return handleError("set", error);
    }
  },

  get<T extends StorageValue>(key: string): StorageResult<T> {
    if (!isLocalStorageAvailable()) {
      return handleError("get", new Error("localStorage is not available"));
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return { success: false, error: "Key not found" };
      }

      try {
        const parsedValue = JSON.parse(item) as T;
        return { success: true, data: parsedValue };
      } catch {
        return { success: true, data: item as T };
      }
    } catch (error) {
      return handleError("get", error);
    }
  },

  remove(key: string): StorageResult<boolean> {
    if (!isLocalStorageAvailable()) {
      return handleError("remove", new Error("localStorage is not available"));
    }

    try {
      localStorage.removeItem(key);
      return { success: true, data: true };
    } catch (error) {
      return handleError("remove", error);
    }
  },

  clear(): StorageResult<boolean> {
    if (!isLocalStorageAvailable()) {
      return handleError("clear", new Error("localStorage is not available"));
    }

    try {
      localStorage.clear();
      return { success: true, data: true };
    } catch (error) {
      return handleError("clear", error);
    }
  },

  exists(key: string): boolean {
    if (!isLocalStorageAvailable()) return false;
    return localStorage.getItem(key) !== null;
  },

  getKeys(): string[] {
    if (!isLocalStorageAvailable()) return [];
    return Object.keys(localStorage);
  },

  size(): number {
    if (!isLocalStorageAvailable()) return 0;
    return localStorage.length;
  },
};

export type { StorageResult, StorageValue };
