import { useState, useCallback } from 'react';
import { useSearchParams } from '@tanstack/react-router';
import type { DatasetViewState, DatasetFilter, DatasetSort } from '../types';

const defaultViewState: DatasetViewState = {
  view: 'grid',
  filters: {},
  sort: {
    field: 'updatedAt',
    order: 'desc',
  },
  selectedIds: new Set(),
};

export function useDatasetViewState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<DatasetViewState>(() => {
    const view = (searchParams.get('view') as DatasetViewState['view']) || defaultViewState.view;
    const sortField = (searchParams.get('sortBy') as DatasetSort['field']) || defaultViewState.sort.field;
    const sortOrder = (searchParams.get('sortOrder') as DatasetSort['order']) || defaultViewState.sort.order;
    const search = searchParams.get('search') || undefined;
    const tags = searchParams.getAll('tag');

    return {
      ...defaultViewState,
      view,
      filters: {
        search,
        tags: tags.length > 0 ? tags : undefined,
      },
      sort: {
        field: sortField,
        order: sortOrder,
      },
    };
  });

  const updateView = useCallback((view: DatasetViewState['view']) => {
    setState(prev => ({ ...prev, view }));
    setSearchParams(prev => ({ ...prev, view }));
  }, [setSearchParams]);

  const updateFilters = useCallback((filters: Partial<DatasetFilter>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
    
    setSearchParams(prev => {
      const newParams = { ...prev };
      
      if (filters.search !== undefined) {
        if (filters.search) {
          newParams.search = filters.search;
        } else {
          delete newParams.search;
        }
      }
      
      if (filters.tags !== undefined) {
        delete newParams.tag;
        if (filters.tags && filters.tags.length > 0) {
          newParams.tag = filters.tags;
        }
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  const updateSort = useCallback((sort: Partial<DatasetSort>) => {
    setState(prev => ({
      ...prev,
      sort: { ...prev.sort, ...sort },
    }));
    
    setSearchParams(prev => ({
      ...prev,
      sortBy: sort.field || prev.sortBy,
      sortOrder: sort.order || prev.sortOrder,
    }));
  }, [setSearchParams]);

  const toggleSelection = useCallback((id: number) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return { ...prev, selectedIds: newSelectedIds };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedIds: new Set() }));
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setState(prev => ({ ...prev, selectedIds: new Set(ids) }));
  }, []);

  return {
    ...state,
    updateView,
    updateFilters,
    updateSort,
    toggleSelection,
    clearSelection,
    selectAll,
  };
}