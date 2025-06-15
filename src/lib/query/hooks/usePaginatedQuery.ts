import { useState, useCallback, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import type { PaginationParams, PaginatedResponse, QueryConfig, ApiError } from '../types';

interface UsePaginatedQueryOptions<TData = unknown> {
  queryKey: (params: PaginationParams) => QueryKey;
  queryFn: (params: PaginationParams) => Promise<PaginatedResponse<TData>>;
  initialPage?: number;
  initialPageSize?: number;
  config?: QueryConfig<PaginatedResponse<TData>, ApiError>;
}

export function usePaginatedQuery<TData = unknown>({
  queryKey,
  queryFn,
  initialPage = 1,
  initialPageSize = 10,
  config,
}: UsePaginatedQueryOptions<TData>) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginationParams: PaginationParams = useMemo(
    () => ({ page, pageSize }),
    [page, pageSize]
  );

  const query = useQuery({
    queryKey: queryKey(paginationParams),
    queryFn: () => queryFn(paginationParams),
    placeholderData: keepPreviousData,
    ...config,
  });

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    if (query.data) {
      setPage(query.data.totalPages);
    }
  }, [query.data]);

  const goToNextPage = useCallback(() => {
    if (query.data && page < query.data.totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [page, query.data]);

  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  return {
    ...query,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: query.data ? page < query.data.totalPages : false,
    hasPreviousPage: page > 1,
  };
}