import { useState, useCallback } from 'react';

interface ApiMutationState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface ApiMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApiMutation<T = any>(
  url: string,
  options?: ApiMutationOptions
) {
  const [state, setState] = useState<ApiMutationState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const mutate = useCallback(
    async (body: any) => {
      setState({ data: null, error: null, isLoading: true });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || 'An error occurred';
          setState({ data: null, error: errorMessage, isLoading: false });
          options?.onError?.(errorMessage);
          return { success: false, error: errorMessage };
        }

        setState({ data, error: null, isLoading: false });
        options?.onSuccess?.(data);
        return { success: true, data };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        setState({ data: null, error: errorMessage, isLoading: false });
        options?.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [url, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}