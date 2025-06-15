import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, ChevronRight, Check } from 'lucide-react';
import { VersionGrid, LoadingOverlay } from '@/components/shared';
import { useDatasetVersions } from '@/hooks/use-datasets-query';
import type { Dataset, DatasetVersion } from '@/lib/api/types';

interface VersionSelectionStepProps {
  dataset: Dataset;
  onSelect: (version: DatasetVersion) => void;
  selectedVersion: DatasetVersion | null;
}

export function VersionSelectionStep({ 
  dataset, 
  onSelect, 
  selectedVersion 
}: VersionSelectionStepProps) {
  const { data: versions = [], isLoading } = useDatasetVersions(dataset.id);

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
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle>Select Version</CardTitle>
          </div>
          <CardDescription>
            Choose a version of "{dataset.name}" to explore
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {isLoading && <LoadingOverlay />}
          
          <VersionGrid
            versions={versions}
            selectedVersionId={selectedVersion?.id}
            onVersionSelect={onSelect}
          />
          
          {selectedVersion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Version {selectedVersion.version_number}</h4>
                    <p className="text-sm text-muted-foreground">
                      Ready to explore
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => onSelect(selectedVersion)}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}