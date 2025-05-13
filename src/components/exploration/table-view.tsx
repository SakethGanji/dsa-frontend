"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Download, 
  Filter, 
  BarChart, 
  PieChart, 
  Loader2 
} from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { datasetsApi } from "@/lib/api"

interface TableViewProps {
  onNext: () => void
  onPrevious: () => void
  datasetId: string | null
}

export default function TableView({ onNext, onPrevious, datasetId }: TableViewProps) {
  const [activeView, setActiveView] = useState("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [rowLimit, setRowLimit] = useState(10)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  // Fetch dataset details
  const { data: dataset, isLoading: isLoadingDataset } = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: async () => {
      if (!datasetId) return null
      try {
        return await datasetsApi.getDatasetById(Number(datasetId))
      } catch (error) {
        console.error("Error fetching dataset:", error)
        return null
      }
    },
    enabled: !!datasetId
  })

  // Fetch dataset versions
  const { data: versions, isLoading: isLoadingVersions } = useQuery({
    queryKey: ["dataset-versions", datasetId],
    queryFn: async () => {
      if (!datasetId) return []
      try {
        return await datasetsApi.getDatasetVersions(Number(datasetId))
      } catch (error) {
        console.error("Error fetching dataset versions:", error)
        return []
      }
    },
    enabled: !!datasetId
  })
  
  // Set the selected version to the current version when dataset loads
  useEffect(() => {
    if (dataset && !selectedVersion) {
      setSelectedVersion(dataset.current_version)
    }
  }, [dataset, selectedVersion])

  // Fetch dataset version data
  const { data: versionData, isLoading: isLoadingData } = useQuery({
    queryKey: ["dataset-version-data", datasetId, selectedVersion, rowLimit],
    queryFn: async () => {
      if (!datasetId || !selectedVersion) return null
      try {
        console.log(`Fetching data for dataset ${datasetId}, version ${selectedVersion}`)
        const result = await datasetsApi.getDatasetVersionData(
          Number(datasetId), 
          selectedVersion, 
          { limit: rowLimit, offset: 0 }
        )
        console.log("API response data:", result)
        return result
      } catch (error) {
        console.error("Error fetching dataset version data:", error)
        return null
      }
    },
    enabled: !!datasetId && !!selectedVersion
  })

  // Data processing functions
  const processData = (data: any) => {
    console.log("Processing data:", data)
    
    if (!data) {
      console.log("No data to process")
      return { columns: [], rows: [] }
    }
    
    // Handle Netflix dataset API format with headers and rows
    if (data.headers && data.rows) {
      console.log("Found headers and rows properties (Netflix dataset format)")
      return { 
        columns: data.headers,
        rows: data.rows 
      }
    }
    
    // Handle common API response formats
    if (data.columns && data.data) {
      console.log("Found columns and data properties")
      return { 
        columns: data.columns,
        rows: data.data 
      }
    }
    
    // If response has a data property that's an array
    if (data.data && Array.isArray(data.data)) {
      console.log("Found data array property")
      if (data.data.length === 0) return { columns: [], rows: [] }
      
      const columns = Object.keys(data.data[0] || {})
      return { columns, rows: data.data }
    }
    
    // If data is an array of objects, extract columns from keys of first item
    if (Array.isArray(data)) {
      console.log("Data is an array")
      if (data.length === 0) return { columns: [], rows: [] }
      
      const columns = Object.keys(data[0] || {})
      return { columns, rows: data }
    }
    
    // Try to handle object with arbitrary structure - look for array properties
    if (typeof data === 'object' && data !== null) {
      console.log("Data is an object, looking for array properties")
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`Found array in property ${key}`)
          const columns = Object.keys(data[key][0] || {})
          return { columns, rows: data[key] }
        }
      }
    }
    
    // Fallback for other formats
    console.log("Could not determine data format, using fallback")
    return { columns: [], rows: [] }
  }

  const processedData = processData(versionData)
  console.log("Processed data:", processedData)
  
  // Filter data based on search term
  const filteredData = processedData.rows?.filter(row => {
    if (!row) return false
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  }) || []

  // Paginated data
  const paginatedData = filteredData.slice(0, rowLimit)

  return (
    <div className="p-6 space-y-6">
      {isLoadingDataset || isLoadingVersions ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading dataset...</span>
        </div>
      ) : !dataset ? (
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">Failed to load dataset</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please go back and select another dataset</p>
        </div>
      ) : (
        <>
          {/* Dataset info header */}
          <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {dataset.name}
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {dataset.description || "No description available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <span className="font-medium">Type:</span> {dataset.file_type ? dataset.file_type.toUpperCase() : 'UNKNOWN'}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {dataset.file_size ? `${(dataset.file_size / 1024).toFixed(1)} KB` : 'UNKNOWN'}
                </div>
                
                {/* Version selector */}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Version:</span>
                  <Select 
                    value={selectedVersion?.toString() || ''} 
                    onValueChange={(value) => setSelectedVersion(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions?.map((version: any) => (
                        <SelectItem key={version.id} value={version.id.toString()}>
                          v{version.version_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                
                {dataset.tags && dataset.tags.length > 0 && (
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {dataset.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="table" value={activeView} onValueChange={setActiveView} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid grid-cols-2 w-[200px]">
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            <TabsContent value="table" className="m-0">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <Input
                      type="search"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>

                    <Select 
                      value={rowLimit.toString()} 
                      onValueChange={(value) => setRowLimit(Number(value))}
                    >
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Show rows" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 rows</SelectItem>
                        <SelectItem value="25">25 rows</SelectItem>
                        <SelectItem value="50">50 rows</SelectItem>
                        <SelectItem value="100">100 rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Loading table data...</span>
                  </div>
                ) : !selectedVersion ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Select a Version</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Please select a dataset version to view the data
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-200 dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {processedData.columns?.map((column: string) => (
                            <TableHead key={column} className="whitespace-nowrap font-medium">
                              {column.charAt(0).toUpperCase() + column.slice(1).replace('_', ' ')}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((row: any, rowIndex: number) => (
                            <TableRow key={rowIndex}>
                              {processedData.columns?.map((column: string) => (
                                <TableCell key={`${rowIndex}-${column}`} className="py-2">
                                  {row[column] !== null && row[column] !== undefined ? String(row[column]) : ''}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell 
                              colSpan={processedData.columns?.length || 1} 
                              className="h-24 text-center"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <p className="font-medium text-gray-700 dark:text-gray-300">No data available</p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  Either no data was returned from the API or the data format is not recognized
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium">{paginatedData.length}</span> of{" "}
                    <span className="font-medium">{filteredData.length}</span> rows
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={rowLimit >= filteredData.length}>
                      Load More
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="visualize" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-100">
                        Distribution by Category
                      </CardTitle>
                      <BarChart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-60 flex items-end justify-around">
                      {/* Mock bar chart */}
                      {['Electronics', 'Clothing', 'Home', 'Food'].map((category, i) => (
                        <motion.div key={category} className="flex flex-col items-center">
                          <div className="relative h-40 w-12">
                            <motion.div
                              className="absolute bottom-0 w-full rounded-t-md bg-violet-500 dark:bg-violet-600"
                              initial={{ height: 0 }}
                              animate={{ height: [40, 80, 60, 100][i] + '%' }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                            />
                          </div>
                          <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">{category}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-100">
                        Price Distribution
                      </CardTitle>
                      <PieChart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-60 flex items-center justify-center">
                      {/* Mock pie chart */}
                      <div className="relative h-40 w-40">
                        <motion.div
                          className="absolute inset-0 rounded-full border-8 border-violet-500 dark:border-violet-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-t-8 border-r-8 border-yellow-500 dark:border-yellow-600"
                          style={{ transform: 'rotate(45deg)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-t-8 border-green-500 dark:border-green-600"
                          style={{ transform: 'rotate(180deg)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        />
                      </div>
                      <div className="ml-4 space-y-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-violet-500 dark:bg-violet-600"></div>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Low (40%)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-yellow-500 dark:bg-yellow-600"></div>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Medium (35%)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 dark:bg-green-600"></div>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">High (25%)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                if (datasetId && selectedVersion) {
                  // Request exploration profile before proceeding to analysis
                  datasetsApi.exploreDataset(Number(datasetId), selectedVersion, {
                    format: "html",
                    run_profiling: true
                  })
                  .then(() => {
                    console.log("Exploration profile generated successfully");
                    onNext();
                  })
                  .catch(error => {
                    console.error("Error generating exploration profile:", error);
                    // Proceed anyway in case the backend already has the profile
                    onNext();
                  });
                } else {
                  onNext();
                }
              }} 
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!selectedVersion}
            >
              Proceed to Analysis
            </Button>
          </div>
        </>
      )}
    </div>
  )
}