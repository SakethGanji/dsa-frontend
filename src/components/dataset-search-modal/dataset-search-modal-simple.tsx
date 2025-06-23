import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  X,
  Database,
  FileText,
  Calendar,
  User,
  Tag,
  Hash,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDatasets } from "@/hooks"
import type { Dataset, DatasetVersion } from "@/lib/api/types"

interface DatasetSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDatasetSelect: (dataset: Dataset, version?: DatasetVersion) => void
  className?: string
  placeholder?: string
}

// Enhanced highlighting function
const highlightText = (text: string, query: string) => {
  if (!query || query.length < 2) return text
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i} className="bg-gradient-to-r from-yellow-200 to-amber-200 dark:from-yellow-700/50 dark:to-amber-700/50 text-amber-900 dark:text-amber-100 px-0.5 rounded font-medium">{part}</mark> 
      : part
  )
}

export function DatasetSearchModal({
  open,
  onOpenChange,
  onDatasetSelect,
  className,
  placeholder = "Search datasets by name, description, or tags...",
}: DatasetSearchModalProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  
  // Fetch all datasets
  const { data: datasets, isLoading } = useDatasets()

  // Filter datasets based on search query
  const filteredDatasets = useMemo(() => {
    if (!datasets) return []
    if (!query) return datasets

    const searchTerm = query.toLowerCase()
    
    return datasets.filter(dataset => {
      // Search in name
      if (dataset.name.toLowerCase().includes(searchTerm)) return true
      
      // Search in description
      if (dataset.description?.toLowerCase().includes(searchTerm)) return true
      
      // Search in tags
      if (dataset.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm))) return true
      
      return false
    })
  }, [datasets, query])

  // Group datasets by tags for facets
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    
    filteredDatasets.forEach(dataset => {
      dataset.tags?.forEach(tag => {
        counts.set(tag.name, (counts.get(tag.name) || 0) + 1)
      })
    })
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 tags
  }, [filteredDatasets])

  // Handle dataset selection
  const handleDatasetSelect = useCallback((dataset: Dataset) => {
    onDatasetSelect(dataset)
    onOpenChange(false)
  }, [onDatasetSelect, onOpenChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "Escape":
          onOpenChange(false)
          break
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredDatasets.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && filteredDatasets[selectedIndex]) {
            handleDatasetSelect(filteredDatasets[selectedIndex])
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, selectedIndex, filteredDatasets, handleDatasetSelect])

  // Auto-focus and reset when modal opens
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(-1)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [selectedIndex])

  const renderLoadingState = () => (
    <div className="p-12 text-center">
      <div className="relative">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-2">Searching...</h3>
        <p className="text-slate-500">Loading datasets</p>
      </div>
    </div>
  )

  const renderEmptyState = () => (
    <div className="p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
        <Search className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-900 mb-2 text-lg">
        {query ? "No results found" : "Ready to search"}
      </h3>
      <p className="text-slate-500">
        {query
          ? `No datasets found matching "${query}"`
          : "Start typing to search across datasets"}
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("!max-w-[55vw] w-[1000px] sm:!max-w-[55vw] p-0 gap-0 bg-white/95 backdrop-blur-xl shadow-2xl border-0 overflow-hidden ring-1 ring-white/20", className)}>
        {/* Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
          <div className="p-8 pb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-14 pr-14 py-5 text-lg border-0 focus-visible:ring-2 focus-visible:ring-blue-500 bg-white shadow-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Search Summary & Tag Cloud */}
          <div className="px-8 pb-6 space-y-4">
            {query && (
              <div className="text-base text-slate-600">
                Found <span className="font-semibold text-slate-900">{filteredDatasets.length}</span> dataset{filteredDatasets.length !== 1 ? 's' : ''} matching <span className="font-medium">"{query}"</span>
              </div>
            )}

            {tagCounts.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm text-slate-500 font-medium">Popular tags:</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {tagCounts.map(([tag, count]) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="group"
                      title={`Filter by ${tag} (${count} datasets)`}
                    >
                      <Badge 
                        variant="outline" 
                        className="text-sm px-3 py-1.5 hover:bg-slate-100/90 hover:border-slate-300 border-slate-200/80 cursor-pointer transition-colors backdrop-blur-sm"
                      >
                        <Tag className="w-3.5 h-3.5 mr-1.5" />
                        {tag}
                        <span className="ml-2 opacity-60">({count})</span>
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[52vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100" ref={resultsRef}>
          {isLoading ? (
            renderLoadingState()
          ) : filteredDatasets.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="divide-y divide-slate-100">
              {!query && (
                <div className="px-6 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">All Datasets</span>
                  </div>
                </div>
              )}
              
              {filteredDatasets.map((dataset, index) => {
                const isSelected = selectedIndex === index
                
                return (
                  <div
                    key={dataset.id}
                    className={cn(
                      "group relative py-6 cursor-pointer transition-all duration-200 border-l-4",
                      isSelected
                        ? "bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-l-blue-500 shadow-md backdrop-blur-sm"
                        : "hover:bg-slate-50/80 border-l-transparent hover:border-l-slate-300 hover:backdrop-blur-sm"
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => handleDatasetSelect(dataset)}
                  >
                    <div className="flex items-start gap-5 px-5">
                      <div className={cn(
                        "p-3 rounded-lg transition-colors mt-1",
                        isSelected
                          ? "bg-blue-100/90 text-blue-600"
                          : "bg-slate-100/90 text-slate-500 group-hover:bg-slate-200/90"
                      )}>
                        <Database className="w-6 h-6 transition-transform group-hover:scale-110" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-slate-900 text-xl leading-tight" title={dataset.name}>
                              {query ? highlightText(dataset.name, query) : dataset.name}
                            </h3>
                            {dataset.description && (
                              <p className="text-slate-600 text-base leading-relaxed" title={dataset.description}>
                                {query ? highlightText(dataset.description, query) : dataset.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight
                            className={cn(
                              "w-6 h-6 text-slate-400 transition-all duration-200 shrink-0 mt-1 opacity-0 group-hover:opacity-100",
                              isSelected && "translate-x-1 opacity-100 text-blue-500"
                            )}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-6 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                              <User className="w-4 h-4" />
                              User {dataset.created_by}
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                              <Calendar className="w-4 h-4" />
                              {new Date(dataset.created_at).toLocaleDateString()}
                            </span>
                            {dataset.file_type && (
                              <span className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                                <FileText className="w-4 h-4" />
                                {dataset.file_type.toUpperCase()}
                              </span>
                            )}
                            {dataset.current_version && (
                              <span className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                                <Hash className="w-4 h-4" />
                                v{dataset.current_version}
                              </span>
                            )}
                          </div>

                          {dataset.tags && dataset.tags.length > 0 && (
                            <div className="flex gap-2 items-center flex-wrap">
                              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                              {dataset.tags.map(tag => (
                                <Badge
                                  key={tag.name}
                                  variant="outline"
                                  className="text-sm px-3 py-1 bg-white/90 border-slate-200/80 hover:bg-slate-50/90 hover:border-slate-300 transition-colors cursor-default backdrop-blur-sm"
                                >
                                  {query ? highlightText(tag.name, query) : tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span>
                Press <kbd className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-mono">↑↓</kbd> to navigate
              </span>
              <span>
                Press <kbd className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-mono">Enter</kbd> to select
              </span>
            </div>
            <span>
              Press <kbd className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-mono">ESC</kbd> to close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}