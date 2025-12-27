import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always consider data stale - ensures fresh data after mutations
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
