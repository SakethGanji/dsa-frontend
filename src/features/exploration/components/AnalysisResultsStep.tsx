import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, RefreshCw, BarChart3, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Dataset, DatasetVersion } from '@/lib/api/types';

interface AnalysisResultsStepProps {
  dataset: Dataset;
  version: DatasetVersion;
  analysisType: string | null;
  profileData?: string;
  onNewAnalysis: () => void;
  onReset: () => void;
}

export function AnalysisResultsStep({
  dataset,
  version,
  analysisType,
  profileData,
  onNewAnalysis,
  onReset,
}: AnalysisResultsStepProps) {
  // Mock insights for demo
  const insights = [
    { label: 'Missing Values', value: '2.3%', status: 'good' },
    { label: 'Duplicate Rows', value: '0', status: 'excellent' },
    { label: 'Data Quality', value: '98.5%', status: 'good' },
    { label: 'Correlations', value: '4 strong', status: 'info' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
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
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Analysis Complete</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Your data analysis is ready to view
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Analysis Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Dataset</p>
              <p className="font-medium">{dataset.name}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">v{version.version_number}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Analysis Type</p>
              <p className="font-medium capitalize">{analysisType} Profiling</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-medium">Just now</p>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {insights.map((insight, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{insight.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${getStatusColor(insight.status)}`}>
                      {insight.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Results Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="correlations">Correlations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {profileData ? (
                    <div
                      className="w-full"
                      dangerouslySetInnerHTML={{ __html: profileData }}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        The analysis provides a comprehensive overview of your dataset including:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>Dataset statistics and shape</li>
                        <li>Missing values analysis</li>
                        <li>Duplicate detection</li>
                        <li>Variable types and distributions</li>
                        <li>Correlation analysis</li>
                      </ul>
                      <div className="p-4 bg-muted rounded-lg">
                        <BarChart3 className="h-32 w-32 mx-auto text-muted-foreground/20" />
                        <p className="text-center text-sm text-muted-foreground mt-4">
                          Interactive visualizations will appear here
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="variables" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">
                    Detailed variable analysis including distributions, statistics, and outliers.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="correlations" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">
                    Correlation matrix and relationship analysis between variables.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onReset}>
              Start New Exploration
            </Button>
            <Button onClick={onNewAnalysis} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Run Another Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}