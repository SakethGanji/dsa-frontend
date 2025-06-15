import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DatasetCard } from './DatasetCard';
import type { Dataset } from '@/lib/api/types';
import type { DatasetActions } from '../types';

interface DatasetGridProps {
  datasets: Dataset[];
  isLoading?: boolean;
  actions: DatasetActions;
  selectedIds?: Set<number>;
  onToggleSelection?: (id: number) => void;
}

export function DatasetGrid({
  datasets,
  isLoading,
  actions,
  selectedIds,
  onToggleSelection,
}: DatasetGridProps) {
  if (isLoading) {
    return <DatasetGridSkeleton />;
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No datasets found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {datasets.map((dataset) => (
        <DatasetCard
          key={dataset.id}
          dataset={dataset}
          actions={actions}
          isSelected={selectedIds?.has(dataset.id)}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </div>
  );
}

function DatasetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full mb-4" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-full" />
        </Card>
      ))}
    </div>
  );
}