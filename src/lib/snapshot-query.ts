import { queryOptions } from '@tanstack/react-query';
import { fetchSnapshot } from '@/lib/app.functions';

export const snapshotQuery = (authKey: string) => queryOptions({
  queryKey: ['snapshot', authKey],
  queryFn: () => fetchSnapshot(),
  staleTime: 10_000,
});
