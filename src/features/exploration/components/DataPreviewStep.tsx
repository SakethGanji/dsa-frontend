import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ChevronRight, Play, History, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { formatByteSize } from '@/lib/utils';
import { format } from 'date-fns';
import type { Dataset, DatasetVersion } from '@/lib/api/types';

interface DataPreviewStepProps {
  dataset: Dataset;
  version: DatasetVersion;
  onContinue: () => void;
  onViewPrevious: () => void;
  hasPreviousAnalyses: boolean;
}

export function DataPreviewStep({
  dataset,
  version,
  onContinue,
  onViewPrevious,
  hasPreviousAnalyses,
}: DataPreviewStepProps) {
  // Fetch preview data
  const { data: tableData, isLoading } = useQuery({
    queryKey: ['dataset-preview', dataset.id, version.id],
    queryFn: async () => {
      const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/datasets/${dataset.id}/versions/${version.id}/data?limit=5&offset=0`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
  });

  const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto p-4"
    >
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle>Explore Data</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Preview your data before running analysis
              </CardDescription>
            </div>
            {hasPreviousAnalyses && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewPrevious}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                View Previous Analysis
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Dataset Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Dataset</p>
              <p className="font-medium">{dataset.name}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">v{version.version_number}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Size</p>
              <p className="font-medium">{formatByteSize(dataset.file_size)}</p>
            </div>
          </div>

          {/* Data Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Preview</h3>
              <Badge variant="secondary">First 5 rows</Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {isLoading ? (
                <DataPreviewSkeleton />
              ) : tableData ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableData.columns?.map((col: string, idx: number) => (
                          <TableHead key={idx} className="min-w-[150px]">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.data?.map((row: Record<string, unknown>, idx: number) => (
                        <TableRow key={idx}>
                          {tableData.columns?.map((col: string, colIdx: number) => (
                            <TableCell key={colIdx} className="font-mono text-sm">
                              {formatCellValue(row[col])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>

            {/* Column Info */}
            {tableData?.columns && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {tableData.columns.length} columns detected
                </p>
                <div className="flex flex-wrap gap-2">
                  {tableData.columns.slice(0, 10).map((col: string) => (
                    <Badge key={col} variant="outline">
                      {col}
                    </Badge>
                  ))}
                  {tableData.columns.length > 10 && (
                    <Badge variant="outline">
                      +{tableData.columns.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-6">
            <Button onClick={onContinue} className="gap-2">
              <Play className="h-4 w-4" />
              Continue to Analysis
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DataPreviewSkeleton() {
  return (
    <div className="p-4">
      <div className="space-y-2">
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-32" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-32" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}