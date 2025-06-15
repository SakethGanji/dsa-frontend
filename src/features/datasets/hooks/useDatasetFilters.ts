import { useMemo } from 'react';
import type { Dataset } from '@/lib/api/types';
import type { DatasetFilter } from '../types';

export function useDatasetFilters(datasets: Dataset[], filters: DatasetFilter) {
  return useMemo(() => {
    let filtered = [...datasets];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(dataset => 
        dataset.name.toLowerCase().includes(searchLower) ||
        dataset.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tag filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(dataset => 
        filters.tags!.some(tag => 
          dataset.tags?.some(datasetTag => datasetTag.name === tag)
        )
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(dataset => {
        const createdAt = new Date(dataset.created_at);
        return createdAt >= filters.dateRange!.start && 
               createdAt <= filters.dateRange!.end;
      });
    }

    // Apply owner filter
    if (filters.owner) {
      filtered = filtered.filter(dataset => 
        dataset.owner === filters.owner
      );
    }

    // Apply status filter
    if (filters.status) {
      // Assuming status is derived from dataset properties
      filtered = filtered.filter(dataset => {
        if (filters.status === 'archived' && dataset.archived_at) return true;
        if (filters.status === 'active' && !dataset.archived_at) return true;
        // Add more status logic as needed
        return false;
      });
    }

    return filtered;
  }, [datasets, filters]);
}