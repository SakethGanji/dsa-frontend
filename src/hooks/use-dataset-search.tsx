import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchRequest, SearchResponse, SearchResult } from '@/lib/api/types';
import type { DatasetInfo } from '../../types/dataset';

// Utility to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(1) + ' MB';
  const gb = mb / 1024;
  return gb.toFixed(1) + ' GB';
}

export interface UseDatasetSearchOptions {
  initialQuery?: string;
  pageSize?: number;
  debounceMs?: number;
}

export interface UseDatasetSearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
  
  // Results
  datasets: DatasetInfo[];
  searchResults: SearchResult[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Facets
  facets?: SearchResponse['facets'];
  
  // Actions
  refetch: () => void;
  clearSearch: () => void;
}

export function useDatasetSearch(options: UseDatasetSearchOptions = {}): UseDatasetSearchReturn {
  const { 
    initialQuery = '', 
    pageSize: initialPageSize = 20,
    debounceMs = 300 
  } = options;
  
  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset to first page on new search
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs]);
  
  // Build search params
  const searchParams: SearchRequest = {
    query: debouncedQuery || undefined,
    fuzzy: true, // Enable fuzzy search by default for partial matches
    limit: pageSize,
    offset: (page - 1) * pageSize,
    include_facets: true,
    sort_by: debouncedQuery ? 'relevance' : 'updated_at',
    sort_order: debouncedQuery ? 'desc' : 'desc',
    search_description: true,
    search_tags: true
  };
  
  // Fetch data using search API
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dataset-search', searchParams],
    queryFn: () => api.datasets.search(searchParams),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
  
  const searchData = data as SearchResponse | undefined;
  
  // Transform search results to DatasetInfo format for compatibility
  const datasets: DatasetInfo[] = (searchData?.results || []).map((result: SearchResult) => ({
    id: result.id,
    name: result.name,
    description: result.description || '',
    version: result.current_version?.toString() || '1',
    fileType: (result.file_type || 'unknown').toUpperCase(),
    fileSize: formatFileSize(result.file_size || 0),
    lastUpdatedTimestamp: result.updated_at,
    uploader: result.created_by_name || `User ${result.created_by}`,
    tags: result.tags
  }));
  
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setPage(1);
  }, []);
  
  const totalPages = Math.ceil((searchData?.total || 0) / pageSize);
  
  return {
    // Search state
    query,
    setQuery,
    debouncedQuery,
    
    // Results
    datasets,
    searchResults: searchData?.results || [],
    total: searchData?.total || 0,
    isLoading,
    isError,
    error: error as Error | null,
    
    // Pagination
    page,
    pageSize,
    totalPages,
    hasMore: searchData?.has_more || false,
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1); // Reset to first page
    },
    
    // Facets
    facets: searchData?.facets,
    
    // Actions
    refetch,
    clearSearch
  };
}