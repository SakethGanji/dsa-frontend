import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Download, 
  Edit, 
  Trash2, 
  Share2, 
  Archive,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { Dataset } from '@/lib/api/types';
import type { DatasetActions, DatasetSort } from '../types';

interface DatasetListProps {
  datasets: Dataset[];
  isLoading?: boolean;
  actions: DatasetActions;
  selectedIds?: Set<number>;
  onToggleSelection?: (id: number) => void;
  onSelectAll?: (ids: number[]) => void;
  sort?: DatasetSort;
  onSort?: (sort: Partial<DatasetSort>) => void;
}

export function DatasetList({
  datasets,
  isLoading,
  actions,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  sort,
  onSort,
}: DatasetListProps) {
  if (isLoading) {
    return <DatasetListSkeleton />;
  }

  const allIds = datasets.map(d => d.id);
  const allSelected = selectedIds?.size === datasets.length && datasets.length > 0;
  const someSelected = (selectedIds?.size ?? 0) > 0 && !allSelected;

  const handleSort = (field: DatasetSort['field']) => {
    if (!onSort) return;
    
    if (sort?.field === field) {
      onSort({ order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ field, order: 'asc' });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={() => onSelectAll?.(allSelected ? [] : allIds)}
                />
              </TableHead>
            )}
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('name')}
              >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('size')}
              >
                Size
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('updatedAt')}
              >
                Updated
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datasets.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={onToggleSelection ? 7 : 6} 
                className="text-center py-8 text-muted-foreground"
              >
                No datasets found
              </TableCell>
            </TableRow>
          ) : (
            datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                {onToggleSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds?.has(dataset.id)}
                      onCheckedChange={() => onToggleSelection(dataset.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => actions.onViewDetails(dataset.id)}
                  >
                    {dataset.name}
                  </Button>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {dataset.description || '-'}
                </TableCell>
                <TableCell>
                  {dataset.tags && dataset.tags.length > 0 ? (
                    <div className="flex gap-1">
                      {dataset.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {dataset.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{dataset.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{formatFileSize(dataset.file_size)}</TableCell>
                <TableCell>{formatDate(dataset.updated_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => actions.onViewDetails(dataset.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => actions.onEdit(dataset.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => actions.onDownload(dataset.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => actions.onShare(dataset.id)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => actions.onArchive(dataset.id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => actions.onDelete(dataset.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DatasetListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}