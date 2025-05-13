"use client";

import { useState } from "react";
import { Search, Filter, Grid, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ExpandableDatasetCard } from "./expandable-dataset-card"; // Import the new component
import type { Dataset } from "@/../types/dataset.ts";

// Sample datasets array
const datasets: Dataset[] = [
    {
        id: 1,
        title: "Customer Transactions",
        description: "Financial transaction data from 2022-2023, including customer IDs, purchase amounts, and dates.",
        type: "CSV",
        size: "2.4 MB",
        lastUpdated: "2023-12-15", // format: "YYYY-MM-DD"
        tags: ["financial", "transactions", "customers", "sales"],
        downloads: 1245,
        version: "1.2",
        uploader: "Data Team",
    },
    {
        id: 2,
        title: "Product Inventory & Stock Levels Worldwide",
        description: "Complete inventory with product details, SKUs, current stock levels across multiple warehouses.",
        type: "JSON",
        size: "4.7 MB",
        lastUpdated: "2024-01-20",
        tags: ["inventory", "products", "stock", "logistics"],
        downloads: 876,
        version: "2.0",
        uploader: "Supply Chain Dept.",
    },
    {
        id: 3,
        title: "User Demographics Study Q1",
        description: "Anonymized user demographic information including age, location, and preferences for market segmentation.",
        type: "CSV",
        size: "1.8 MB",
        lastUpdated: "2024-02-05",
        tags: ["users", "demographics", "research"],
        downloads: 2134,
        version: "1.0",
        uploader: "Marketing Insights",
    },
    {
        id: 4,
        title: "Website Analytics",
        description: "Page views, bounce rates, and user engagement metrics for the main corporate website.",
        type: "JSON",
        size: "3.2 MB",
        lastUpdated: "2024-02-28",
        tags: ["analytics", "web", "metrics"],
        downloads: 1567,
        version: "3.1",
        uploader: "Web Team",
    },
    {
        id: 5,
        title: "Marketing Campaign Results",
        description: "Performance metrics for all 2023 marketing campaigns, including ROI and reach.",
        type: "Excel",
        size: "5.1 MB",
        lastUpdated: "2024-01-10",
        tags: ["marketing", "campaigns", "performance"],
        downloads: 932,
        version: "1.5",
        uploader: "Marketing Ops",
    },
    {
        id: 6,
        title: "Supply Chain Data",
        description: "Logistics and supply chain performance indicators, shipment tracking, and delivery times.",
        type: "CSV",
        size: "3.9 MB",
        lastUpdated: "2024-03-01",
        tags: ["logistics", "supply chain", "shipments"],
        downloads: 745,
        version: "2.2",
        uploader: "Logistics Team",
    },
];


export function DatasetsDisplay() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredDatasets = datasets.filter(
        (dataset) =>
            dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dataset.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    // Map the datasets to the format expected by the ExpandableDatasetCard component
    const datasetInfos = filteredDatasets.map(dataset => ({
        id: dataset.id,
        name: dataset.title,
        description: dataset.description,
        version: dataset.version,
        fileType: dataset.type,
        fileSize: dataset.size,
        lastUpdatedTimestamp: dataset.lastUpdated,
        uploader: dataset.uploader,
        tags: dataset.tags,
    }));

    const handleDatasetView = (datasetId: number) => {
        const dataset = datasets.find(d => d.id === datasetId);
        console.log(`Viewing dataset: ${dataset?.title}`);
        // Implement navigation or modal logic for viewing details
    };

    const handleDatasetDownload = (datasetId: number) => {
        const dataset = datasets.find(d => d.id === datasetId);
        console.log(`Downloading dataset: ${dataset?.title}`);
        // Add actual download logic here
    };

    const handleDatasetSave = (datasetId: number) => {
        const dataset = datasets.find(d => d.id === datasetId);
        console.log(`Saving dataset: ${dataset?.title}`);
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
                        placeholder="Search datasets..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>File Type</DropdownMenuItem>
                                <DropdownMenuItem>Date Updated</DropdownMenuItem>
                                <DropdownMenuItem>Size</DropdownMenuItem>
                                <DropdownMenuItem>Tags</DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Select defaultValue="newest">
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Sort by</SelectLabel>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

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

                    <Button>Upload Dataset</Button>
                </div>
            </div>

            {/* Using ExpandableDatasetCard for both grid and list views */}
            <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-4xl mx-auto" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
                <ExpandableDatasetCard
                    datasets={datasetInfos}
                    onView={handleDatasetView}
                    onDownload={handleDatasetDownload}
                    onSave={handleDatasetSave}
                    isList={viewMode === "list"}
                />
            </div>

            {filteredDatasets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No datasets found matching your search criteria.</p>
                </div>
            )}
        </div>
    );
}