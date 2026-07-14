"use client";

import { useState, useEffect, useCallback } from "react";
import {
  loadOptions,
  getOptionsByCategory,
  getOptionById,
  getAllOptions,
  isValidOption,
  clearOptionsCache,
  reloadOptions,
  type OptionsConfig,
  type AppOption,
} from "@/lib/options-loader";

interface UseOptionsReturn {
  options: OptionsConfig | null;
  loading: boolean;
  error: Error | null;
  getByCategory: (category: string) => AppOption[];
  getById: (id: string) => AppOption | undefined;
  getAll: () => AppOption[];
  isValid: (id: string) => boolean;
  reload: () => Promise<void>;
}

export function useOptions(): UseOptionsReturn {
  const [options, setOptions] = useState<OptionsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initial load
  useEffect(() => {
    const initOptions = async () => {
      try {
        setLoading(true);
        const loadedOptions = await loadOptions();
        setOptions(loadedOptions);
        setError(null);
      } catch (err) {
        console.error("[v0] Error loading options:", err);
        setError(err instanceof Error ? err : new Error("Failed to load options"));
      } finally {
        setLoading(false);
      }
    };

    initOptions();
  }, []);

  const getByCategory = useCallback(
    (category: string): AppOption[] => {
      if (!options) return [];
      return getOptionsByCategory(options, category);
    },
    [options]
  );

  const getById = useCallback(
    (id: string): AppOption | undefined => {
      if (!options) return undefined;
      return getOptionById(options, id);
    },
    [options]
  );

  const getAll = useCallback((): AppOption[] => {
    if (!options) return [];
    return getAllOptions(options);
  }, [options]);

  const isValid = useCallback(
    (id: string): boolean => {
      if (!options) return false;
      return isValidOption(options, id);
    },
    [options]
  );

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      clearOptionsCache();
      const reloadedOptions = await reloadOptions();
      setOptions(reloadedOptions);
      setError(null);
    } catch (err) {
      console.error("[v0] Error reloading options:", err);
      setError(err instanceof Error ? err : new Error("Failed to reload options"));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    options,
    loading,
    error,
    getByCategory,
    getById,
    getAll,
    isValid,
    reload,
  };
}
