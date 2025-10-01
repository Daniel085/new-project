import { useState, useEffect, useCallback } from 'react';

interface ApiQueryState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface ApiQueryOptions {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApiQuery<T = any>(
  url: string | null,
  options?: ApiQueryOptions
) {
  const [state, setState] = useState<ApiQueryState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const enabled = options?.enabled ?? true;

  const refetch = useCallback(async () => {
    if (!url) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'An error occurred';
        setState({ data: null, error: errorMessage, isLoading: false });
        options?.onError?.(errorMessage);
        return;
      }

      setState({ data, error: null, isLoading: false });
      options?.onSuccess?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setState({ data: null, error: errorMessage, isLoading: false });
      options?.onError?.(errorMessage);
    }
  }, [url, options]);

  useEffect(() => {
    if (enabled && url) {
      refetch();
    }
  }, [url, enabled, refetch]);

  return {
    ...state,
    refetch,
  };
}