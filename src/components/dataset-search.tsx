"use client"

import { useState, useEffect, useRef } from "react" // Added useRef
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Search, BarChart2, FileText, Download, Tag, Calendar } from "lucide-react"
import useDebounce from "@/hooks/use-debounce"
import { api } from "@/lib/api/index" // Corrected import path
import type { Dataset } from "@/lib/api/types"
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from "./providers/auth-provider"

interface DatasetAction {
  id: number
  name: string
  description?: string | null
  icon: React.ReactNode
  fileType?: string | null
  fileSize?: number | null
  createdAt: string
  tags?: { name: string }[] | null
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(1) + ' MB';
  const gb = mb / 1024;
  return gb.toFixed(1) + ' GB';
}

function getFileIcon(fileType?: string | null) {
  if (!fileType) return <FileText className="h-4 w-4 text-muted-foreground" />;
  
  switch(fileType.toLowerCase()) {
    case 'csv':
      return <BarChart2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'xlsx':
    case 'xls':
      return <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case 'json':
      return <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

export function DatasetSearchBar({ onSelectDataset }: { onSelectDataset?: (dataset: Dataset) => void }) {
  const [query, setQuery] = useState("")
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const debouncedQuery = useDebounce(query, 300)
  const { isAuthenticated } = useAuth()
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Added blur timeout ref

  useEffect(() => {
    if (!isFocused || !isAuthenticated) {
      return;
    }

    async function fetchDatasets() {
      setLoading(true);
      try {
        const params: import("@/lib/api/types").DatasetListParams = { limit: 10, offset: 0 }; // Typed params

        if (debouncedQuery) {
          // Try to search in both name and description
          params.name = debouncedQuery;
        }
        
        const results = await api.datasets.getAll(params);
        setDatasets(results);
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
        setDatasets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDatasets();
  }, [debouncedQuery, isFocused, isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    if (onSelectDataset) {
      onSelectDataset(dataset);
    }
    setIsFocused(false);
  }

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: {
          duration: 0.4,
        },
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: {
          duration: 0.3,
        },
        opacity: {
          duration: 0.2,
        },
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  }

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
    setSelectedDataset(null); // Clear previous selection on focus
  }

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 200);
  }

  // Map datasets to actions
  const datasetActions: DatasetAction[] = datasets.map(dataset => ({
    id: dataset.id,
    name: dataset.name,
    description: dataset.description,
    icon: getFileIcon(dataset.file_type),
    fileType: dataset.file_type,
    fileSize: dataset.file_size,
    createdAt: dataset.created_at,
    tags: dataset.tags
  }));

  return (
    <div className="w-full mx-auto">
      <div className="relative flex flex-col justify-start items-center min-h-[200px]">
        <div className="w-full sticky top-0 bg-background z-10 pt-4 pb-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block" htmlFor="search">
            Search Datasets
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name or description..."
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur} // Changed to use the new handleBlur
              className="pl-3 pr-9 py-1.5 h-10 text-sm rounded-lg focus-visible:ring-offset-0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
                  />
                ) : (
                  <motion.div
                    key="search"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full">
          <AnimatePresence>
            {isFocused && !selectedDataset && datasetActions.length > 0 && (
              <motion.div
                key="dataset-list-container" // Added key
                className="w-full border rounded-md shadow-lg overflow-hidden bg-popover mt-1"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.ul className="max-h-[400px] overflow-y-auto">
                  {datasetActions.map((action) => (
                    <motion.li
                      key={action.id}
                      className="px-4 py-3 hover:bg-accent cursor-pointer border-b border-border last:border-none"
                      variants={item}
                      layout
                      onClick={() => {
                        const dataset = datasets.find(d => d.id === action.id);
                        if (dataset) handleSelectDataset(dataset);
                      }}
                    >
                      <div className="flex items-start">
                        <div className="p-1.5 bg-muted rounded-md mr-3 mt-0.5">
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground truncate">{action.name}</h4>
                            <span className="ml-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                              {action.fileType?.toUpperCase() || "UNKNOWN"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {action.description || "No description"}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground space-x-3">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}</span>
                            </div>
                            {action.fileSize !== undefined && (
                              <div className="flex items-center">
                                <Download className="h-3 w-3 mr-1" />
                                <span>{formatFileSize(action.fileSize)}</span>
                              </div>
                            )}
                          </div>
                          {action.tags && action.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {action.tags.slice(0, 3).map(tag => (
                                <span 
                                  key={tag.name} 
                                  className="inline-flex items-center text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag.name}
                                </span>
                              ))}
                              {action.tags.length > 3 && (
                                <span className="inline-flex items-center text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                  +{action.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="mt-2 px-4 py-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs">↵</kbd> to select</span>
                    <span><kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs">ESC</kbd> to cancel</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {isFocused && !loading && datasetActions.length === 0 && (
              <motion.div
                key="no-datasets-message-container" // Added key
                className="w-full border rounded-md shadow-lg overflow-hidden bg-popover mt-1 p-6 text-center"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <div className="text-sm text-muted-foreground">
                  {query ? "No datasets found matching your search" : "No datasets available"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
