import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30초
        gcTime: 5 * 60 * 1000, // 5분
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}
