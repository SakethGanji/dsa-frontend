"use client"

import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useOutsideClick } from "@/hooks/use-outside-click"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconArrowUpRight,
    IconCalendar,
    IconUser,
    IconBookmark,
    IconCloudDownload,
} from "@tabler/icons-react"

// Define the dataset information interface
interface DatasetInfo {
    id: number
    name: string
    description: string
    version: string
    fileType: string
    fileSize: string
    lastUpdatedTimestamp: string
    uploader: string
    tags: string[]
}

// Define the detailed dataset information interface
interface DetailedDatasetInfo {
    id: number;
    additionalDetails: {
        rowCount: number;
        columnCount: number;
        createdAt: string;
        lastAccessed: string;
        format: string;
        encoding: string;
        validationStatus: string;
    };
}

// Main component props
interface ExpandableDatasetCardProps {
    datasets: DatasetInfo[]
    onView: (id: number) => void
    onDownload: (id: number) => void
    onSave: (id: number) => void
    isList?: boolean
}

// Common utilities and shared components
const formatDate = (dateString: string) => {
    const date = new Date(
        dateString.includes(" ") ? dateString.replace(" ", "T") : dateString
    )
    if (isNaN(date.getTime())) {
        return "Invalid Date"
    }
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date)
}

// Action buttons component for reuse
interface ActionButtonsProps {
    datasetId: number
    onView: (id: number) => void
    onDownload: (id: number) => void
    onSave: (id: number) => void
    layoutId?: string
}

const ActionButtons = ({ datasetId, onView, onDownload, onSave, layoutId }: ActionButtonsProps) => (
    <motion.div layoutId={layoutId} className="flex gap-2">
        {/* Save */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20"
                onClick={(e) => {
                    e.stopPropagation()
                    onSave(datasetId)
                }}
                aria-label="Save"
            >
                <IconBookmark className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" stroke={2} />
            </Button>
        </motion.div>

        {/* Download */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-transparent hover:bg-sky-50 dark:hover:bg-sky-900/20"
                onClick={(e) => {
                    e.stopPropagation()
                    onDownload(datasetId)
                }}
                aria-label="Download"
            >
                <IconCloudDownload className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" stroke={2} />
            </Button>
        </motion.div>

        {/* View */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={(e) => {
                    e.stopPropagation()
                    onView(datasetId)
                }}
                aria-label="View"
            >
                <IconArrowUpRight className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" stroke={2} />
            </Button>
        </motion.div>
    </motion.div>
)

// Tags display component
interface TagsDisplayProps {
    tags: string[]
    limit?: number
    showPlus?: boolean
    initialDelayOffset?: number
    isExpanded?: boolean
}

const TagsDisplay = ({ 
    tags, 
    limit = 3, 
    showPlus = true, 
    initialDelayOffset = 0,
    isExpanded = false
}: TagsDisplayProps) => {
    const displayTags = isExpanded ? tags : tags.slice(0, limit)
    
    return (
        <motion.div className="flex flex-wrap gap-2">
            {displayTags.map((tag, i) => (
                <motion.div
                    key={tag}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: initialDelayOffset + i * 0.1 },
                    }}
                >
                    <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0.5 rounded-md font-medium bg-secondary/60 hover:bg-secondary/80 transition-colors"
                    >
                        {tag}
                    </Badge>
                </motion.div>
            ))}
            {!isExpanded && showPlus && tags.length > limit && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: initialDelayOffset + limit * 0.1 },
                    }}
                >
                    <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-md border-dashed">
                        +{tags.length - limit}
                    </Badge>
                </motion.div>
            )}
        </motion.div>
    )
}

// Type Info component (file type, size)
interface TypeInfoProps {
    fileType: string
    fileSize: string
    layoutId?: string
}

const TypeInfo = ({ fileType, fileSize, layoutId }: TypeInfoProps) => (
    <motion.div layoutId={layoutId} className="flex items-center gap-1.5">
        <Badge
            variant="outline"
            className="text-xs font-medium px-2 py-0.5 rounded-full"
        >
            {fileType.toUpperCase()}
        </Badge>
        <span className="mx-1">•</span>
        <span>{fileSize}</span>
    </motion.div>
)

// Grid Card View
interface GridCardViewProps {
    dataset: DatasetInfo
    isExpanded: boolean
    onView: (id: number) => void
    onDownload: (id: number) => void
    onSave: (id: number) => void
    uniqueId: string
}

const GridCardView = ({ dataset, isExpanded, onView, onDownload, onSave, uniqueId }: GridCardViewProps) => (
    <>
        <CardHeader className="p-3 pb-1">
            <div className="flex justify-between items-start gap-2">
                <motion.div layoutId={`title-${dataset.id}-${uniqueId}`} className="flex-grow">
                    <CardTitle className="text-sm line-clamp-2">{dataset.name}</CardTitle>
                </motion.div>
                <motion.div layoutId={`badge-${dataset.id}-${uniqueId}`}>
                    <Badge variant="outline" className="whitespace-nowrap">
                        v{dataset.version}
                    </Badge>
                </motion.div>
            </div>
            <motion.div layoutId={`description-${dataset.id}-${uniqueId}`}>
                <CardDescription className={`line-clamp-3 !mt-1 ${isExpanded ? "!line-clamp-none" : ""}`}>
                    {dataset.description}
                </CardDescription>
            </motion.div>
        </CardHeader>

        <CardContent className="px-4 pt-2 pb-2 flex-grow space-y-2">
            <motion.div layoutId={`info-${dataset.id}-${uniqueId}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <TypeInfo 
                        fileType={dataset.fileType} 
                        fileSize={dataset.fileSize} 
                    />

                    <div className="flex items-center gap-1.5">
                        <IconCalendar className="h-3.5 w-3.5 text-muted-foreground" stroke={1.5} />
                        <span>{formatDate(dataset.lastUpdatedTimestamp)}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-2 text-sm text-muted-foreground">
                    <TagsDisplay 
                        tags={dataset.tags} 
                        isExpanded={isExpanded} 
                    />
                </div>
            </motion.div>
        </CardContent>

        <CardFooter className="px-4 py-2 flex justify-between items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <IconUser className="h-3.5 w-3.5 text-muted-foreground" stroke={1.5} />
                <span className="truncate max-w-[100px] sm:max-w-[150px]">{dataset.uploader}</span>
            </div>

            <ActionButtons
                datasetId={dataset.id}
                onView={onView}
                onDownload={onDownload}
                onSave={onSave}
                layoutId={`actions-${dataset.id}-${uniqueId}`}
            />
        </CardFooter>
    </>
)

// List Card View
interface ListCardViewProps {
    dataset: DatasetInfo
    isExpanded: boolean
    onView: (id: number) => void
    onDownload: (id: number) => void
    onSave: (id: number) => void
    uniqueId: string
}

const ListCardView = ({ dataset, isExpanded, onView, onDownload, onSave, uniqueId }: ListCardViewProps) => (
    <div className="flex flex-row items-center w-full px-3 py-3 gap-4">
        {/* Title and Version (Combined) */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <motion.div layoutId={`title-${dataset.id}-${uniqueId}`}>
                <CardTitle className="text-sm line-clamp-1 whitespace-nowrap">
                    {dataset.name}
                </CardTitle>
            </motion.div>
            <motion.div layoutId={`badge-${dataset.id}-${uniqueId}`}>
                <Badge variant="outline" className="whitespace-nowrap">
                    v{dataset.version}
                </Badge>
            </motion.div>
        </div>

        {/* Description (truncated) - takes available space */}
        <motion.div layoutId={`description-${dataset.id}-${uniqueId}`} className="flex-grow min-w-0">
            <CardDescription
                className={`line-clamp-1 text-xs ${
                    isExpanded ? "!line-clamp-none" : ""
                }`}
            >
                {dataset.description}
            </CardDescription>
        </motion.div>

        {/* TypeInfo - flex-shrink-0 to prevent shrinking */}
        <motion.div layoutId={`info-${dataset.id}-${uniqueId}`} className="flex-shrink-0">
            <div className="flex items-center text-xs text-muted-foreground">
                <TypeInfo
                    fileType={dataset.fileType}
                    fileSize={dataset.fileSize}
                />
            </div>
        </motion.div>

        {/* Tags - flex-shrink-0 and limit for single line */}
        <motion.div layoutId={`tags-${dataset.id}-${uniqueId}`} className="flex-shrink-0">
            <TagsDisplay
                tags={dataset.tags}
                isExpanded={isExpanded}
                limit={isExpanded ? dataset.tags.length : 2} // Show 2 tags or all if expanded
                showPlus={!isExpanded}
            />
        </motion.div>

        {/* Metadata (Uploader & Date) - flex-shrink-0 */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
            <div className="flex items-center gap-1.5">
                <IconUser className="h-3.5 w-3.5 flex-shrink-0" stroke={1.5} />
                <span className="truncate max-w-[100px]">{dataset.uploader}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <IconCalendar className="h-3.5 w-3.5 flex-shrink-0" stroke={1.5} />
                <span className="whitespace-nowrap">{formatDate(dataset.lastUpdatedTimestamp)}</span>
            </div>
        </div>

        {/* Action Buttons - flex-shrink-0 */}
        <div className="flex-shrink-0">
            <ActionButtons
                datasetId={dataset.id}
                onView={onView}
                onDownload={onDownload}
                onSave={onSave}
                layoutId={`actions-${dataset.id}-${uniqueId}`}
            />
        </div>
    </div>
)

// Generic DatasetCard wrapper
interface DatasetCardProps {
    dataset: DatasetInfo
    isExpanded: boolean
    isListView: boolean
    uniqueId: string
    onView: (id: number) => void
    onDownload: (id: number) => void
    onSave: (id: number) => void
}

const DatasetCard = ({ 
    dataset, 
    isExpanded, 
    isListView, 
    uniqueId,
    onView,
    onDownload,
    onSave
}: DatasetCardProps) => (
    <Card
        className={`h-full flex ${
            isListView ? "flex-row" : "flex-col"
        } gap-0 py-0 ${
            !isExpanded
                ? "cursor-pointer hover:bg-muted/20 hover:shadow-md dark:hover:bg-muted/10 transition-all duration-200"
                : ""
        } border-muted/40 bg-gradient-to-b from-card to-card/70`}
    >
        {isListView ? (
            <ListCardView 
                dataset={dataset} 
                isExpanded={isExpanded} 
                onView={onView}
                onDownload={onDownload}
                onSave={onSave}
                uniqueId={uniqueId}
            />
        ) : (
            <GridCardView 
                dataset={dataset} 
                isExpanded={isExpanded} 
                onView={onView}
                onDownload={onDownload}
                onSave={onSave}
                uniqueId={uniqueId}
            />
        )}
    </Card>
)

// Close button icon component
const CloseIcon = () => (
    <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.05 } }}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
    >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
    </motion.svg>
)

// Function to fetch detailed dataset information
// Replace this with your actual API call
const fetchDetailedDataset = async (datasetId: number): Promise<DetailedDatasetInfo> => {
    // This is a placeholder for your actual API call
    // Example:
    // return fetch(`/api/datasets/${datasetId}/details`).then(res => res.json());
    
    // For now, we'll simulate an API call with a delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: datasetId,
                additionalDetails: {
                    rowCount: Math.floor(Math.random() * 100000) + 5000,
                    columnCount: Math.floor(Math.random() * 50) + 10,
                    createdAt: new Date().toISOString(),
                    lastAccessed: new Date().toISOString(),
                    format: "CSV",
                    encoding: "UTF-8",
                    validationStatus: "Passed",
                }
            });
        }, 300); // Simulate network delay
    });
};

// The main exported component
export function ExpandableDatasetCard({
    datasets,
    onView,
    onDownload,
    onSave,
    isList = false,
}: ExpandableDatasetCardProps) {
    const [active, setActive] = useState<DatasetInfo | null>(null)
    const [detailData, setDetailData] = useState<DetailedDatasetInfo | null>(null) // Updated type
    const id = useId()
    const ref = useRef<HTMLDivElement>(null)

    // Handle escape key to close modal
    // Function to close the detail view
    const closeDetailView = () => {
        setActive(null);
        setDetailData(null);
    };

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closeDetailView();
            }
        }

        document.body.style.overflow = active ? "hidden" : "auto"
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [active])

    // Handle clicks outside the modal to close it
    useOutsideClick(ref as React.RefObject<HTMLDivElement>, closeDetailView)

    return (
        <>
            {/* Backdrop overlay when detail view is active */}
            <AnimatePresence>
                {active && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 h-full w-full z-10"
                    />
                )}
            </AnimatePresence>

            {/* Detail view modal */}
            <AnimatePresence>
                {active ? (
                    <div className="fixed inset-0 grid place-items-center z-[100]">
                        {/* Close button */}
                        <motion.button
                            key={`button-${active.id}-${id}`}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.05 } }}
                            className="flex absolute top-2 right-2 items-center justify-center bg-card text-card-foreground rounded-full h-6 w-6 shadow-md border border-border transition-colors"
                            onClick={closeDetailView}
                        >
                            <CloseIcon />
                        </motion.button>

                        {/* Modal content container */}
                        <motion.div
                            layoutId={`card-${active.id}-${id}`}
                            ref={ref}
                            className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-card sm:rounded-3xl overflow-hidden shadow-xl border border-border"
                        >
                            <DatasetCard 
                                dataset={active}
                                isExpanded={true}
                                isListView={false}
                                uniqueId={id}
                                onView={onView}
                                onDownload={onDownload}
                                onSave={onSave}
                            />
                            
                            {/* Display additional data if available */}
                            {detailData && (
                                <div className="p-4 border-t border-muted/30 overflow-auto">
                                    <h3 className="text-sm font-medium mb-2">Additional Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        {detailData.additionalDetails && Object.entries(detailData.additionalDetails).map(([key, value]) => (
                                            <div key={key} className="flex flex-col">
                                                <span className="text-muted-foreground capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                                </span>
                                                <span className="font-medium">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                ) : null}
            </AnimatePresence>

            {/* Grid or list view of datasets */}
            {datasets.map((dataset) => {
                // Optimize card rendering with memoization
                const handleCardClick = () => {
                    // First set active to provide immediate feedback
                    setActive(dataset);
                    
                    // Then fetch additional data (async)
                    fetchDetailedDataset(dataset.id)
                        .then(detailedData => {
                            // Store the detailed data in state
                            setDetailData(detailedData);
                        })
                        .catch(error => {
                            console.error('Error fetching detailed dataset:', error);
                            // Clear any previous detail data on error
                            setDetailData(null);
                        });
                };
                
                return (
                    <motion.div
                        layoutId={`card-${dataset.id}-${id}`}
                        key={dataset.id}
                        onClick={handleCardClick}
                        className="cursor-pointer relative group"
                    >
                        <DatasetCard 
                            dataset={dataset}
                            isExpanded={false}
                            isListView={isList}
                            uniqueId={id}
                            onView={onView}
                            onDownload={onDownload}
                            onSave={onSave}
                        />
                    </motion.div>
                );
            })}
        </>
    )
}
