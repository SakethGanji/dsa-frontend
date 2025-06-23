import { useQuery } from '@tanstack/react-query';
import { api, type DatasetStatistics } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

interface UseDatasetStatisticsOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

export function useDatasetStatistics(
  datasetId: number | undefined,
  versionId?: number,
  options?: UseDatasetStatisticsOptions
) {
  return useQuery<DatasetStatistics>({
    queryKey: versionId 
      ? queryKeys.exploration.statistics(datasetId!, versionId)
      : queryKeys.exploration.statistics(datasetId!, 0),
    queryFn: async () => {
      if (!datasetId) {
        throw new Error('Dataset ID is required');
      }
      
      if (versionId) {
        return await api.datasets.versions.getStatistics(datasetId, versionId);
      } else {
        return await api.datasets.getStatistics(datasetId);
      }
    },
    enabled: !!datasetId && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  });
}