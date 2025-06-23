"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Grid, List, Loader2, X, TrendingUp, Tag, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { SuggestResponse } from "@/lib/api/types";
// Simplified toast hook for our demo
const useToast = () => {
    return {
        toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
            console.log(`Toast: ${title} - ${description || ''}`);
            // In a real app, this would show a toast notification
        }
    };
};
import { PaginationControls } from "@/components/pagination-controls";

import { ExpandableDatasetCard } from "./expandable-dataset-card";
import { useDatasetSearch } from "@/hooks/use-dataset-search";
import { DatasetUploadModal } from "./dataset-upload-modal";

export function DatasetsDisplay() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestResponse | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Use the new search hook
    const {
        query,
        setQuery,
        datasets,
        total,
        isLoading,
        isError,
        error,
        refetch,
        page,
        pageSize,
        totalPages,
        setPage: handlePageChange,
        setPageSize: handlePageSizeChange,
        facets,
        clearSearch
    } = useDatasetSearch({
        pageSize: 12,
        debounceMs: 300
    });

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 2 || !showSuggestions) {
                setSuggestions(null);
                return;
            }

            try {
                const response = await api.datasets.suggest({
                    query,
                    limit: 6,
                    types: ['dataset_name', 'tag']
                });
                setSuggestions(response);
            } catch (error) {
                console.error('Suggestions failed:', error);
                setSuggestions(null);
            }
        };

        const timer = setTimeout(fetchSuggestions, 150);
        return () => clearTimeout(timer);
    }, [query, showSuggestions]);

    // Filter datasets by selected tags (client-side filtering of already fetched results)
    const filteredDatasets = useMemo(() => {
        if (selectedTags.length === 0) return datasets;
        return datasets.filter(dataset => 
            selectedTags.every(tag => dataset.tags.includes(tag))
        );
    }, [datasets, selectedTags]);

    // Toggle tag selection
    const toggleTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion: string) => {
        setQuery(suggestion);
        setShowSuggestions(false);
        setSuggestionIndex(-1);
        inputRef.current?.focus();
    };

    // Keyboard navigation for suggestions
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showSuggestions || !suggestions) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSuggestionIndex(prev => 
                        prev < suggestions.suggestions.length - 1 ? prev + 1 : prev
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
                    break;
                case "Enter":
                    e.preventDefault();
                    if (suggestionIndex >= 0 && suggestions.suggestions[suggestionIndex]) {
                        handleSuggestionSelect(suggestions.suggestions[suggestionIndex].text);
                    }
                    break;
                case "Escape":
                    setShowSuggestions(false);
                    setSuggestionIndex(-1);
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showSuggestions, suggestions, suggestionIndex, handleSuggestionSelect]);

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.search-wrapper') && !target.closest('.suggestions-box')) {
                setShowSuggestions(false);
                setSuggestionIndex(-1);
            }
        };

        if (showSuggestions) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showSuggestions]);

    // Show error toast if fetching fails
    useEffect(() => {
        if (isError) {
            // Safely extract error message
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to load datasets. Please try again.";
            
            toast({
                title: "Error loading datasets",
                description: errorMessage,
                variant: "destructive",
            });
        }
    }, [isError, error, toast]);

    const handleDatasetView = (datasetId: number) => {
        const dataset = filteredDatasets.find(d => d.id === datasetId);
        console.log(`Viewing dataset: ${dataset?.name}`);
        // Implement navigation or modal logic for viewing details
    };

    const handleDatasetDownload = (datasetId: number) => {
        const dataset = filteredDatasets.find(d => d.id === datasetId);
        console.log(`Downloading dataset: ${dataset?.name}`);
        // Add actual download logic here
    };

    const handleDatasetSave = (datasetId: number) => {
        const dataset = filteredDatasets.find(d => d.id === datasetId);
        console.log(`Saving dataset: ${dataset?.name}`);
        // Implement save/bookmark logic
    };


    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="space-y-2 search-wrapper">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                type="search"
                                placeholder="Search datasets by name, description, or tags..."
                                className="pl-8 pr-10 w-full"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowSuggestions(true);
                                    setSuggestionIndex(-1);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                autoComplete="off"
                            />
                            {query && (
                                <button
                                    onClick={() => {
                                        clearSearch();
                                        setShowSuggestions(false);
                                        setSuggestions(null);
                                    }}
                                    className="absolute right-2.5 top-2.5 p-1 rounded-sm hover:bg-slate-100"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        
                        {/* Suggestions Box */}
                        {showSuggestions && suggestions && suggestions.suggestions.length > 0 && (
                            <div className="w-full md:w-96 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden suggestions-box">
                                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3" />
                                        Suggestions
                                    </span>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {suggestions.suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "px-3 py-2 cursor-pointer flex items-center justify-between transition-colors",
                                                suggestionIndex === index 
                                                    ? "bg-blue-50 border-l-2 border-blue-500" 
                                                    : "hover:bg-slate-50 border-l-2 border-transparent"
                                            )}
                                            onClick={() => handleSuggestionSelect(suggestion.text)}
                                            onMouseEnter={() => setSuggestionIndex(index)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "p-1 rounded",
                                                    suggestion.type === 'tag' 
                                                        ? "bg-purple-100 text-purple-600" 
                                                        : "bg-blue-100 text-blue-600"
                                                )}>
                                                    {suggestion.type === 'tag' ? (
                                                        <Tag className="w-3 h-3" />
                                                    ) : (
                                                        <Database className="w-3 h-3" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-slate-900">{suggestion.text}</span>
                                                    <span className="text-xs text-slate-500 ml-1.5">
                                                        {suggestion.type === 'tag' ? 'Tag' : 'Dataset'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium",
                                                suggestion.score > 0.8 ? "text-green-600" : 
                                                suggestion.score > 0.6 ? "text-yellow-600" : "text-slate-500"
                                            )}>
                                                {Math.round(suggestion.score * 100)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Show popular tags from facets */}
                    {facets?.tags && facets.tags.values.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">Popular tags:</span>
                            {facets.tags.values.slice(0, 8).map(({ value, count }) => (
                                <Badge
                                    key={value}
                                    variant={selectedTags.includes(value) ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-slate-100"
                                    onClick={() => toggleTag(value)}
                                >
                                    {value} ({count})
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">

                    <div className="flex border rounded-md">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("grid")}
                            className="rounded-r-none"
                            aria-label="Grid view"
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("list")}
                            className="rounded-l-none"
                            aria-label="List view"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button onClick={() => setShowUploadModal(true)}>Upload Dataset</Button>
                </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading datasets...</span>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-destructive">Error loading datasets</p>
                    <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => refetch()}
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <>
                    {/* Selected tags display */}
                    {selectedTags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">Filtering by:</span>
                            {selectedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="default"
                                    className="pl-2 pr-1"
                                >
                                    {tag}
                                    <button
                                        onClick={() => toggleTag(tag)}
                                        className="ml-1 p-0.5 hover:bg-white/20 rounded"
                                        aria-label={`Remove ${tag} filter`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTags([])}
                            >
                                Clear all
                            </Button>
                        </div>
                    )}

                    {/* Dataset grid or list */}
                    {filteredDatasets.length > 0 ? (
                        <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-6xl mx-auto w-full" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"}>
                            <ExpandableDatasetCard
                                datasets={filteredDatasets}
                                onView={handleDatasetView}
                                onDownload={handleDatasetDownload}
                                onSave={handleDatasetSave}
                                isList={viewMode === "list"}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground">
                                {query || selectedTags.length > 0 
                                    ? "No datasets found matching your search criteria." 
                                    : "No datasets available."}
                            </p>
                            {(query || selectedTags.length > 0) && (
                                <Button 
                                    variant="outline" 
                                    className="mt-4"
                                    onClick={() => {
                                        clearSearch();
                                        setSelectedTags([]);
                                    }}
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {datasets.length > 0 && (
                        <PaginationControls
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            pageSize={pageSize}
                            onPageSizeChange={handlePageSizeChange}
                            totalItems={total}
                            className="mt-8"
                        />
                    )}
                </>
            )}

            <DatasetUploadModal
                open={showUploadModal}
                onOpenChange={setShowUploadModal}
                onUploadSuccess={() => {
                    refetch();
                    toast({
                        title: "Success",
                        description: "Dataset uploaded successfully",
                    });
                }}
            />
        </div>
    );
}