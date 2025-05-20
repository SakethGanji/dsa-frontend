"use client"

import { useState, useRef, useEffect } from "react"
import { DatasetSearchBar } from "@/components/dataset-search"
import { motion, AnimatePresence } from "framer-motion"
import type { Dataset } from "@/lib/api/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart2, Database, FileDown, Book, Eye, Tag, Search, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { useNavigate } from "@tanstack/react-router"
import { useDatasetVersions, useExploreDataset } from "@/hooks"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createExploreOptions, explorationOperations } from "@/hooks/use-exploration-query"

export function ExplorationPage() {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  const { 
    data: versions,
    isLoading: versionsLoading, 
    isError: versionsError 
  } = useDatasetVersions(
    selectedDataset?.id || 0, 
    { enabled: !!selectedDataset }
  );

  // Add exploration mutation
  const exploreMutation = useExploreDataset<any>();

  // Auto-select the first version when versions load
  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0].id);
    }
  }, [versions, selectedVersion]);

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setSelectedVersion(null); // Reset selected version
    setActiveTab("overview"); // Reset to overview tab
    
    // Scroll to results if on mobile
    setTimeout(() => {
      if (window.innerWidth < 768 && searchRef.current) {
        searchRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  const handleExploreData = () => {
    if (!selectedDataset || !selectedVersion) return;
    
    const versionId = selectedVersion;
    const datasetId = selectedDataset.id;
    
    // Example exploration with basic operations
    const operations = [
      explorationOperations.sampleRows(1000, 'random'),
    ];
    
    exploreMutation.mutate({
      datasetId,
      versionId,
      options: createExploreOptions(operations, { run_profiling: true })
    }, {
      onSuccess: () => {
        setActiveTab("exploration");
      }
    });
  };

  const formatByteSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown";
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  const getFileIcon = (fileType?: string | null) => {
    switch(fileType?.toLowerCase()) {
      case 'csv':
        return <BarChart2 className="h-5 w-5 text-green-500" />;
      case 'xlsx':
      case 'xls':
        return <BarChart2 className="h-5 w-5 text-blue-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Exploration</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Search for datasets and explore data with advanced analytics tools
          </p>
        </div>
        
        {/* Hero Search Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="max-w-2xl mx-auto text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Find Your Dataset</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Search from the available datasets to begin your data exploration journey</p>
            
            <div className="max-w-md mx-auto transform transition-all hover:scale-[1.01]">
              <DatasetSearchBar onSelectDataset={handleSelectDataset} />
            </div>
            
            <div className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-4">
              <div className="flex items-center">
                <Search className="h-3 w-3 mr-1" />
                <span>Search by name</span>
              </div>
              <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                <span>View tags</span>
              </div>
              <div className="flex items-center">
                <Book className="h-3 w-3 mr-1" />
                <span>Explore data</span>
              </div>
            </div>
          </div>
        </div>
        
        <div ref={searchRef}></div>
        
        <AnimatePresence mode="wait">
          {selectedDataset && (
            <motion.div
              key="dataset-info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Dataset Overview Card */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="exploration" disabled={exploreMutation.isPending}>
                      {exploreMutation.isPending ? "Loading..." : "Exploration"}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(selectedDataset.file_type)}
                        <CardTitle>{selectedDataset.name}</CardTitle>
                      </div>
                      <CardDescription className="mt-2">
                        {selectedDataset.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500">File Type</span>
                          <span className="text-lg font-semibold">
                            {selectedDataset.file_type?.toUpperCase() || "Unknown"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500">Size</span>
                          <span className="text-lg font-semibold">
                            {formatByteSize(selectedDataset.file_size)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500">Last Updated</span>
                          <span className="text-lg font-semibold">
                            {format(new Date(selectedDataset.updated_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      
                      {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                            <Tag className="h-4 w-4 mr-1" /> Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedDataset.tags.map(tag => (
                              <Badge key={tag.id} variant="outline" className="rounded-full">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          if (selectedDataset.id) {
                            navigate({ to: `/datasets/${selectedDataset.id}` });
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex items-center"
                        onClick={handleExploreData}
                        disabled={!selectedVersion || exploreMutation.isPending}
                      >
                        <Book className="h-4 w-4 mr-1" /> 
                        {exploreMutation.isPending ? "Loading..." : "Explore Data"}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Versions Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Available Versions</h3>
                    <div className="space-y-3">
                      {versionsLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </div>
                        ))
                      ) : versionsError ? (
                        <Card>
                          <CardContent className="py-4 text-center text-red-500">
                            Failed to load versions
                          </CardContent>
                        </Card>
                      ) : versions && versions.length > 0 ? (
                        versions.map(version => (
                          <Card 
                            key={version.id} 
                            className={`hover:shadow-md transition-shadow ${selectedVersion === version.id ? 'border-blue-500 shadow-blue-100 dark:shadow-blue-900/20' : ''}`}
                            onClick={() => setSelectedVersion(version.id)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center">
                                  {selectedVersion === version.id && (
                                    <ArrowRight className="h-4 w-4 mr-1 text-blue-500" />
                                  )}
                                  Version {version.version_number}
                                </CardTitle>
                                <Badge className={`ml-2 ${selectedVersion === version.id ? 'bg-blue-500' : ''}`}>
                                  {version.file_type?.toUpperCase() || "UNKNOWN"}
                                </Badge>
                              </div>
                              <CardDescription>
                                Uploaded {format(new Date(version.ingestion_timestamp), 'MMM d, yyyy')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="flex items-center text-sm text-gray-500">
                                <Database className="h-4 w-4 mr-1" />
                                <span>{formatByteSize(version.file_size)}</span>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2 pt-0">
                              <Button variant="outline" size="sm" className="flex items-center">
                                <FileDown className="h-4 w-4 mr-1" /> Download
                              </Button>
                              <Button 
                                variant={selectedVersion === version.id ? "default" : "outline"} 
                                size="sm" 
                                className="flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVersion(version.id);
                                  handleExploreData();
                                }}
                                disabled={exploreMutation.isPending}
                              >
                                <Book className="h-4 w-4 mr-1" /> Explore
                              </Button>
                            </CardFooter>
                          </Card>
                        ))
                      ) : (
                        <Card>
                          <CardContent className="py-4 text-center text-gray-500">
                            No versions available for this dataset
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Exploration Tab */}
                <TabsContent value="exploration">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Exploration</CardTitle>
                      <CardDescription>
                        Analyzing and visualizing dataset: {selectedDataset.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {exploreMutation.isPending ? (
                        <div className="py-12 text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
                          <p className="text-gray-500">Processing your data...</p>
                        </div>
                      ) : exploreMutation.isError ? (
                        <div className="py-8 text-center text-red-500">
                          <p>Error analyzing dataset: {exploreMutation.error.message}</p>
                        </div>
                      ) : exploreMutation.data ? (
                        <div className="space-y-6">
                          <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                            <pre className="text-xs">
                              {JSON.stringify(exploreMutation.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <p>Select a dataset version and click "Explore Data" to begin analysis</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
          
          {!selectedDataset && (
            <motion.div
              key="dataset-placeholder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Database className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No dataset selected</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Search for a dataset above to begin exploration. You can analyze data, create visualizations, and generate insights.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}