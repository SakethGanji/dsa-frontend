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
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Dataset, DatasetVersion, SearchResult, SearchResponse, SuggestResponse } from "@/lib/api/types"

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
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SuggestResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchData, setSearchData] = useState<SearchResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!open) return
      
      setIsLoading(true)
      try {
        const response = await api.datasets.search({
          query: debouncedQuery || undefined,
          fuzzy: true, // Enable fuzzy search by default for partial matches
          limit: 50,
          include_facets: true,
          search_description: true,
          search_tags: true,
          sort_by: debouncedQuery ? 'relevance' : 'updated_at',
          sort_order: 'desc'
        })
        setSearchData(response)
        setSearchResults(response.results)
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchResults()
  }, [debouncedQuery, open])

  // Fetch suggestions for autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2 || !showSuggestions) {
        setSuggestions(null)
        return
      }

      try {
        const response = await api.datasets.suggest({
          query,
          limit: 5,
          types: ['dataset_name', 'tag'] // Specify we want both types
        })
        setSuggestions(response)
      } catch (error) {
        console.error('Suggestions failed:', error)
        setSuggestions(null)
      }
    }

    const timer = setTimeout(fetchSuggestions, 100)
    return () => clearTimeout(timer)
  }, [query, showSuggestions])

  // Transform search results to Dataset format for compatibility
  const filteredDatasets: Dataset[] = searchResults.map(result => ({
    id: result.id,
    name: result.name,
    description: result.description,
    created_by: result.created_by,
    created_at: result.created_at,
    updated_at: result.updated_at,
    current_version: result.current_version,
    file_type: result.file_type,
    file_size: result.file_size,
    tags: result.tags.map(tag => ({ name: tag, description: null, id: 0, usage_count: null })),
    versions: []
  }))

  // Get tag counts from facets
  const tagCounts = useMemo(() => {
    if (!searchData?.facets?.tags) return []
    return searchData.facets.tags.values
      .slice(0, 10)
      .map(({ value, count }) => [value, count] as [string, number])
  }, [searchData])

  // Handle dataset selection
  const handleDatasetSelect = useCallback((dataset: Dataset) => {
    onDatasetSelect(dataset)
    onOpenChange(false)
  }, [onDatasetSelect, onOpenChange])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [])

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
          if (showSuggestions && suggestions && selectedIndex >= 0 && suggestions.suggestions[selectedIndex]) {
            handleSuggestionSelect(suggestions.suggestions[selectedIndex].text)
          } else if (!showSuggestions && selectedIndex >= 0 && filteredDatasets[selectedIndex]) {
            handleDatasetSelect(filteredDatasets[selectedIndex])
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, selectedIndex, filteredDatasets, handleDatasetSelect, showSuggestions, suggestions, handleSuggestionSelect])

  // Auto-focus and reset when modal opens
  useEffect(() => {
    if (open) {
      setQuery("")
      setDebouncedQuery("")
      setSelectedIndex(-1)
      setShowSuggestions(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.search-input-wrapper') && !target.closest('#suggestions-list')) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showSuggestions])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      if (showSuggestions && suggestions) {
        const suggestionsList = document.getElementById('suggestions-list')
        if (suggestionsList) {
          const selectedElement = suggestionsList.children[selectedIndex] as HTMLElement
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
          }
        }
      } else if (resultsRef.current) {
        const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
        }
      }
    }
  }, [selectedIndex, showSuggestions, suggestions])

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
        {debouncedQuery ? "No results found" : "Ready to search"}
      </h3>
      <p className="text-slate-500">
        {debouncedQuery
          ? `No datasets found matching "${debouncedQuery}"`
          : "Start typing to search across datasets"}
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("!max-w-[55vw] w-[1000px] sm:!max-w-[55vw] !max-h-[90vh] p-0 gap-0 bg-white/95 backdrop-blur-xl shadow-2xl border-0 overflow-hidden ring-1 ring-white/20 flex flex-col", className)}>
        {/* Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 relative">
          <div className="p-8 pb-6 space-y-3">
            <div className="relative search-input-wrapper">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                placeholder={placeholder}
                className="pl-14 pr-14 py-5 text-lg border-0 focus-visible:ring-2 focus-visible:ring-blue-500 bg-white shadow-sm"
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("")
                    setShowSuggestions(false)
                  }}
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
            
            {/* Suggestions Box - Now positioned below search bar */}
            {showSuggestions && suggestions && suggestions.suggestions.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-white border-b border-slate-200">
                  <span className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Suggestions
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto" id="suggestions-list">
                  {suggestions.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={cn(
                        "px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors",
                        selectedIndex === index 
                          ? "bg-blue-50 border-l-2 border-blue-500" 
                          : "hover:bg-white border-l-2 border-transparent"
                      )}
                      onClick={() => handleSuggestionSelect(suggestion.text)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded",
                          suggestion.type === 'tag' 
                            ? "bg-purple-100 text-purple-600" 
                            : "bg-blue-100 text-blue-600"
                        )}>
                          {suggestion.type === 'tag' ? (
                            <Tag className="w-3.5 h-3.5" />
                          ) : (
                            <Database className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{suggestion.text}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {suggestion.type === 'tag' ? 'Tag' : 'Dataset'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className={cn(
                          "font-medium",
                          suggestion.score > 0.8 ? "text-green-600" : 
                          suggestion.score > 0.6 ? "text-yellow-600" : "text-slate-500"
                        )}>
                          {Math.round(suggestion.score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs">↑↓</kbd> to navigate • <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs">Enter</kbd> to select
                </div>
              </div>
            )}
          </div>

          {/* Search Summary & Tag Cloud */}
          <div className="px-8 pb-4 space-y-3">
            {debouncedQuery && searchData && (
              <div className="text-sm text-slate-600">
                Found <span className="font-semibold text-slate-900">{searchData.total}</span> dataset{searchData.total !== 1 ? 's' : ''} matching <span className="font-medium">"{debouncedQuery}"</span>
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
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100" ref={resultsRef}>
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
                              {debouncedQuery ? highlightText(dataset.name, debouncedQuery) : dataset.name}
                            </h3>
                            {dataset.description && (
                              <p className="text-slate-600 text-base leading-relaxed" title={dataset.description}>
                                {debouncedQuery ? highlightText(dataset.description, debouncedQuery) : dataset.description}
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
                              {searchResults.find(r => r.id === dataset.id)?.created_by_name || `User ${dataset.created_by}`}
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
                                  {debouncedQuery ? highlightText(tag.name, debouncedQuery) : tag.name}
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