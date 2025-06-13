"use client";

import { useState, useEffect } from "react";
import { Search, Grid, List, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { usePaginatedDatasets } from "@/hooks/use-datasets";
import type { DatasetInfo } from "../../types/dataset";
import { DatasetUploadModal } from "./dataset-upload-modal";

export function DatasetsDisplay() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const { toast } = useToast();

    // Initialize dataset query with TanStack Query
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        search,
        pagination,
        filters,
        setFilters,
    } = usePaginatedDatasets({ 
        limit: 10, 
        offset: 0,
        search: debouncedSearch
    });

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Handle search input changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    };

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

    // Extract datasets for the component
    const datasetInfos = data?.datasetInfos || [];

    const handleDatasetView = (datasetId: number) => {
        const dataset = datasetInfos.find(d => d.id === datasetId);
        console.log(`Viewing dataset: ${dataset?.name}`);
        // Implement navigation or modal logic for viewing details
    };

    const handleDatasetDownload = (datasetId: number) => {
        const dataset = datasetInfos.find(d => d.id === datasetId);
        console.log(`Downloading dataset: ${dataset?.name}`);
        // Add actual download logic here
    };

    const handleDatasetSave = (datasetId: number) => {
        const dataset = datasetInfos.find(d => d.id === datasetId);
        console.log(`Saving dataset: ${dataset?.name}`);
        // Implement save/bookmark logic
    };


    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="In development..."
                        className="pl-8 w-full"
                        value={searchInput}
                        onChange={handleSearchChange}
                    />
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
                    {/* Dataset grid or list */}
                    <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-4xl mx-auto" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
                        {datasetInfos.length > 0 ? (
                            <ExpandableDatasetCard
                                datasets={datasetInfos}
                                onView={handleDatasetView}
                                onDownload={handleDatasetDownload}
                                onSave={handleDatasetSave}
                                isList={viewMode === "list"}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 col-span-full">
                                <p className="text-muted-foreground">No datasets found matching your search criteria.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {datasetInfos.length > 0 && (
                        <PaginationControls
                            currentPage={pagination.currentPage}
                            totalPages={Math.max(pagination.totalPages || 1, 
                                // Make sure we show at least 1 page even if totalPages is 0
                                datasetInfos.length > 0 ? 1 : 0)}
                            onPageChange={pagination.goToPage}
                            pageSize={filters.limit || 10}
                            onPageSizeChange={pagination.setPageSize}
                            totalItems={data?.total}
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