import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showCheckbox?: boolean;
  showActions?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showCheckbox = false,
  showActions = false,
}: TableSkeletonProps) {
  const totalColumns = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckbox && (
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
            )}
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
            {showActions && (
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {showCheckbox && (
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
              )}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
              ))}
              {showActions && (
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}