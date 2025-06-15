import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, ChevronRight, History } from 'lucide-react';
import { DatasetSelector } from '@/components/shared';
import { useDatasets } from '@/hooks/use-datasets-query';
import type { Dataset } from '@/lib/api/types';

interface DatasetSelectionStepProps {
  onSelect: (dataset: Dataset) => void;
  selectedDataset: Dataset | null;
}

export function DatasetSelectionStep({ onSelect, selectedDataset }: DatasetSelectionStepProps) {
  const { data: datasets = [], isLoading } = useDatasets();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Select Dataset</CardTitle>
          </div>
          <CardDescription>
            Choose a dataset to explore and analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatasetSelector
            datasets={datasets}
            selectedDatasetId={selectedDataset?.id}
            onDatasetSelect={onSelect}
            loading={isLoading}
          />
          
          {selectedDataset && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedDataset.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDataset.description || 'No description available'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {selectedDataset.tags?.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button size="sm" onClick={() => onSelect(selectedDataset)}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
          
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" />
            <span>Previous explorations will be available after selection</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}