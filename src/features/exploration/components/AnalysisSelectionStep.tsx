import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Sparkles, FileText } from 'lucide-react';
import type { AnalysisOption } from '../types';

const analysisOptions: AnalysisOption[] = [
  {
    id: 'pandas',
    name: 'Pandas Profiling',
    description: 'Comprehensive data profiling with statistics and visualizations',
    icon: BarChart3,
  },
  {
    id: 'sweetviz',
    name: 'SweetViz Analysis',
    description: 'Beautiful visualizations and data comparisons',
    icon: Sparkles,
  },
  {
    id: 'custom',
    name: 'Custom Analysis',
    description: 'Build your own analysis with custom parameters',
    icon: FileText,
  },
];

interface AnalysisSelectionStepProps {
  onSelect: (analysisId: string) => void;
  selectedAnalysis: string | null;
  isAnalyzing: boolean;
}

export function AnalysisSelectionStep({
  onSelect,
  selectedAnalysis,
  isAnalyzing,
}: AnalysisSelectionStepProps) {
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
          <CardTitle>Choose Analysis Type</CardTitle>
          <CardDescription>
            Select how you want to analyze your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {analysisOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedAnalysis === option.id;
              
              return (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary ring-opacity-20'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => !isAnalyzing && onSelect(option.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          isSelected ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{option.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(option.id);
                            }}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}