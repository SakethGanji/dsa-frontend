import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Grid3X3, List, Search, Plus } from 'lucide-react';
import { DatasetGrid } from './DatasetGrid';
import { DatasetList } from './DatasetList';
import { DatasetFilters } from './DatasetFilters';
import { usePaginatedDatasets, useDatasetTags } from '../hooks';
import { useDatasetViewState } from '../hooks/useDatasetViewState';
import { useDatasetActions } from '../hooks/useDatasetActions';
import { useDatasetFilters } from '../hooks/useDatasetFilters';
import type { DatasetViewState } from '../types';

export function DatasetsView() {
  const viewState = useDatasetViewState();
  const actions = useDatasetActions();
  const { data: tags = [] } = useDatasetTags();
  
  const {
    data,
    isLoading,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    hasNextPage,
    hasPreviousPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  } = usePaginatedDatasets(1, 20, viewState.filters);

  const datasets = data?.data || [];
  const filteredDatasets = useDatasetFilters(datasets, viewState.filters);

  const ViewComponent = viewState.view === 'grid' ? DatasetGrid : DatasetList;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Datasets</h1>
        <Button onClick={actions.onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Dataset
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search datasets..."
              value={viewState.filters.search || ''}
              onChange={(e) => viewState.updateFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <DatasetFilters
          filters={viewState.filters}
          onFiltersChange={viewState.updateFilters}
          availableTags={tags.map(t => t.name)}
        />

        <ToggleGroup
          type="single"
          value={viewState.view}
          onValueChange={(value) => value && viewState.updateView(value as DatasetViewState['view'])}
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Selection Actions */}
      {viewState.selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {viewState.selectedIds.size} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Bulk delete
              if (confirm(`Delete ${viewState.selectedIds.size} datasets?`)) {
                Promise.all(
                  Array.from(viewState.selectedIds).map(id => actions.onDelete(id))
                ).then(() => viewState.clearSelection());
              }
            }}
          >
            Delete Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={viewState.clearSelection}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Content */}
      <ViewComponent
        datasets={filteredDatasets}
        isLoading={isLoading}
        actions={actions}
        selectedIds={viewState.selectedIds}
        onToggleSelection={viewState.toggleSelection}
        onSelectAll={viewState.selectAll}
        sort={viewState.sort}
        onSort={viewState.updateSort}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.total)} of {data.total} datasets
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={!hasPreviousPage}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!hasPreviousPage}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={page}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="w-16 text-center"
                min={1}
                max={data.totalPages}
              />
              <span className="text-sm text-muted-foreground">
                of {data.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!hasNextPage}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={!hasNextPage}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}