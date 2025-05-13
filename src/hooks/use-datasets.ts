import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { datasetsApi } from '@/lib/api';
// Import types with explicit path
import type { DatasetInfo } from '../../types/dataset';
import { mapApiResponseToDatasetInfo } from '../../types/dataset';

// Import DatasetResponse type for use within the file
import type { DatasetResponse } from '../../types/dataset';

// Query keys for cache management
export const datasetKeys = {
  all: ['datasets'] as const,
  lists: () => [...datasetKeys.all, 'list'] as const,
  list: (filters: DatasetFilters) => [...datasetKeys.lists(), filters] as const,
  details: () => [...datasetKeys.all, 'detail'] as const,
  detail: (id: number) => [...datasetKeys.details(), id] as const,
};

export interface DatasetFilters {
  limit?: number;
  offset?: number;
  search?: string;
}

export function useDatasetsQuery(filters: DatasetFilters = {}) {
  const { limit = 10, offset = 0 } = filters;
  
  // Convert client-side search to filter function for results
  const searchTerm = filters.search?.toLowerCase() || '';
  
  return useQuery({
    queryKey: datasetKeys.list({ limit, offset, search: searchTerm }),
    queryFn: async () => {
      // Call the API to get the datasets
      // For a real implementation, we would also get the total count from the API
      // For now, we'll assume we need to use the client-side filtering
      const data = await datasetsApi.getDatasets({ limit, offset });
      
      // We'll assume for now we need to do client-side filtering for search
      // In a production app, you would pass the search term to the API
      const filteredData = searchTerm
        ? data.filter(
            (dataset) =>
              dataset.name.toLowerCase().includes(searchTerm) ||
              dataset.description.toLowerCase().includes(searchTerm) ||
              dataset.tags.some((tag) => tag.name.toLowerCase().includes(searchTerm))
          )
        : data;
      
      // This approach assumes the API doesn't return a total count
      // In a real application, the API would return the total count 
      // or you would make a separate count request
      const total = data.length === limit ? limit + 1 : data.length; // Estimate for pagination
      
      // Map API response to component-friendly format
      return {
        datasets: filteredData,
        datasetInfos: filteredData.map(mapApiResponseToDatasetInfo),
        total: total,
      };
    },
    staleTime: 30 * 1000, // 30 seconds - shorter time for development
  });
}

export function useDatasetQuery(id: number) {
  return useQuery({
    queryKey: datasetKeys.detail(id),
    queryFn: () => datasetsApi.getDatasetById(id),
    enabled: !!id,
  });
}

// Hook that combines pagination state with the datasets query
export function usePaginatedDatasets(initialFilters: DatasetFilters = {}) {
  // State for pagination and filtering
  const [filters, setFilters] = useState<DatasetFilters>({
    limit: 10,
    offset: 0,
    ...initialFilters,
  });
  
  // Execute the query with current filters
  const query = useDatasetsQuery(filters);
  
  // Helper functions for pagination
  const goToNextPage = () => {
    if (query.data) {
      setFilters((prev) => ({
        ...prev,
        offset: prev.offset! + prev.limit!,
      }));
    }
  };

  const goToPreviousPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset! - prev.limit!),
    }));
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (page - 1) * prev.limit!),
    }));
  };

  const setPageSize = (pageSize: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: pageSize,
      offset: 0, // Reset to first page when changing page size
    }));
  };

  const setSearchTerm = (search: string) => {
    setFilters((prev) => ({
      ...prev,
      search,
      offset: 0, // Reset to first page when searching
    }));
  };

  // Calculate pagination information
  const currentPage = Math.floor(filters.offset! / filters.limit!) + 1;
  const totalPages = query.data
    ? Math.ceil(query.data.total / filters.limit!)
    : 0;

  return {
    ...query,
    filters,
    setFilters,
    pagination: {
      currentPage,
      totalPages,
      goToNextPage,
      goToPreviousPage,
      goToPage,
      setPageSize,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
    search: {
      term: filters.search || '',
      setSearchTerm,
    },
  };
}