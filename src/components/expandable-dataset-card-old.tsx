"use client"

import {
    createContext,
    memo,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { useDatasetStatistics } from "@/hooks/use-dataset-statistics"
import type { DatasetStatistics } from "@/lib/api"

// UI Components (assuming these are from shadcn/ui)
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconArrowUpRight,
    IconCalendar,
    IconUser,
    IconBookmark,
    IconCloudDownload,
    IconDatabase,
    IconColumns,
    IconFileCode,
    IconClock,
    IconX,
} from "@tabler/icons-react"

// --- TYPES ---
// Kept the same, they are well-defined.
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

interface DetailedDatasetInfo {
    id: number
    statistics?: DatasetStatistics | null
}

// --- CONTEXT ---
// IMPROVEMENT: Use Context to avoid prop drilling `onView`, `onSave`, etc.
interface DatasetCardContextType {
    onView: (id: number) => void
    onDownload: (id: number) => void
    onSave: (id: number) => void
    onSelect: (dataset: DatasetInfo) => void
    uniqueId: string
}

const DatasetCardContext = createContext<DatasetCardContextType | null>(null)

const useDatasetCardContext = () => {
    const context = useContext(DatasetCardContext)
    if (!context) {
        throw new Error("useDatasetCardContext must be used within a DatasetCardProvider")
    }
    return context
}

// --- UTILITIES ---
const formatDate = (dateString: string) => {
    // Robust date parsing
    const date = new Date(dateString.includes(" ") ? dateString.replace(" ", "T") + "Z" : dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date)
}



// --- REUSABLE SUB-COMPONENTS (MEMOIZED) ---

const ActionButtons = memo(({ datasetId }: { datasetId: number }) => {
    // IMPROVEMENT: Gets handlers from context instead of props
    const { onView, onDownload, onSave, uniqueId } = useDatasetCardContext()

    const stopPropagationAndCall = (fn: (id: number) => void) => (e: React.MouseEvent) => {
        e.stopPropagation()
        fn(datasetId)
    }

    return (
        <motion.div 
            layoutId={`actions-${datasetId}-${uniqueId}`} 
            className="flex gap-0.5"
            transition={{ duration: 0.15 }}
        >
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-destructive/10 transition-colors" onClick={stopPropagationAndCall(onSave)} aria-label="Save">
                <IconBookmark className="h-3.5 w-3.5 text-destructive" stroke={2} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-blue-500/10 transition-colors" onClick={stopPropagationAndCall(onDownload)} aria-label="Download">
                <IconCloudDownload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" stroke={2} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-green-500/10 transition-colors" onClick={stopPropagationAndCall(onView)} aria-label="View">
                <IconArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" stroke={2} />
            </Button>
        </motion.div>
    )
})
ActionButtons.displayName = "ActionButtons"


const TagsDisplay = memo(({ tags, limit = 3, isExpanded = false }: { tags: string[], limit?: number, isExpanded?: boolean }) => {
    const displayTags = isExpanded ? tags : tags.slice(0, limit)

    return (
        <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0.5 font-medium bg-secondary/80 hover:bg-secondary transition-colors">
                    {tag}
                </Badge>
            ))}
            {!isExpanded && tags.length > limit && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-dashed">
                    +{tags.length - limit}
                </Badge>
            )}
        </div>
    )
})
TagsDisplay.displayName = "TagsDisplay"


const TypeInfo = memo(({ fileType, fileSize }: { fileType: string, fileSize: string }) => (
    <div className="flex items-center gap-1.5 text-xs">
        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
            {fileType.toUpperCase()}
        </Badge>
        <span className="text-muted-foreground">{fileSize}</span>
    </div>
))
TypeInfo.displayName = "TypeInfo"


// --- CARD LAYOUTS (MEMOIZED) ---

const GridCardView = memo(({ dataset }: { dataset: DatasetInfo }) => {
    const { uniqueId } = useDatasetCardContext()
    return (
        <div className="flex flex-col h-full p-2.5 gap-1.5">
            <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <motion.div layoutId={`title-${dataset.id}-${uniqueId}`} className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold leading-tight break-words">
                            {dataset.name}
                        </CardTitle>
                    </motion.div>
                    <motion.div layoutId={`badge-${dataset.id}-${uniqueId}`} className="flex-shrink-0">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">v{dataset.version}</Badge>
                    </motion.div>
                </div>
                <motion.div layoutId={`description-${dataset.id}-${uniqueId}`}>
                    <CardDescription className="text-xs leading-snug line-clamp-2">{dataset.description}</CardDescription>
                </motion.div>
            </div>
            <div className="space-y-1.5">
                <motion.div layoutId={`metadata-${dataset.id}-${uniqueId}`} className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <TypeInfo fileType={dataset.fileType} fileSize={dataset.fileSize} />
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1"><IconCalendar className="h-3 w-3" stroke={1.5} /><span className="whitespace-nowrap">{formatDate(dataset.lastUpdatedTimestamp)}</span></div>
                </motion.div>
                <motion.div layoutId={`tags-${dataset.id}-${uniqueId}`}>
                    <TagsDisplay tags={dataset.tags} limit={2} />
                </motion.div>
            </div>
            <div className="mt-auto pt-1.5 border-t border-border/20 flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                    <IconUser className="h-3 w-3 flex-shrink-0" stroke={1.5} />
                    <span className="truncate">{dataset.uploader}</span>
                </div>
                <ActionButtons datasetId={dataset.id} />
            </div>
        </div>
    )
})
GridCardView.displayName = "GridCardView"


const ListCardView = memo(({ dataset }: { dataset: DatasetInfo }) => {
    const { uniqueId } = useDatasetCardContext()
    return (
        <div className="p-2.5 md:p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <motion.div 
                            layoutId={`title-${dataset.id}-${uniqueId}`}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <CardTitle className="text-sm font-semibold leading-tight">{dataset.name}</CardTitle>
                        </motion.div>
                        <motion.div 
                            layoutId={`badge-${dataset.id}-${uniqueId}`}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">v{dataset.version}</Badge>
                        </motion.div>
                    </div>
                    <motion.div 
                        layoutId={`description-${dataset.id}-${uniqueId}`}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <CardDescription className="text-xs leading-tight mb-1.5 line-clamp-1">{dataset.description}</CardDescription>
                    </motion.div>
                    <motion.div 
                        layoutId={`metadata-${dataset.id}-${uniqueId}`} 
                        className="flex flex-wrap items-center gap-2 text-[11px]"
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <TypeInfo fileType={dataset.fileType} fileSize={dataset.fileSize} />
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-0.5 text-muted-foreground"><IconCalendar className="h-2.5 w-2.5" stroke={1.5} /><span>{formatDate(dataset.lastUpdatedTimestamp)}</span></div>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-0.5 text-muted-foreground"><IconUser className="h-2.5 w-2.5" stroke={1.5} /><span>{dataset.uploader}</span></div>
                    </motion.div>
                </div>
                <motion.div 
                    layoutId={`tags-${dataset.id}-${uniqueId}`} 
                    className="hidden md:block"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <TagsDisplay tags={dataset.tags} limit={3} />
                </motion.div>
                <ActionButtons datasetId={dataset.id} />
            </div>
        </div>
    )
})
ListCardView.displayName = "ListCardView"

const DatasetCard = memo(({ dataset, isListView }: { dataset: DatasetInfo, isListView: boolean }) => {
    // IMPROVEMENT: Gets `onSelect` from context
    const { onSelect, uniqueId } = useDatasetCardContext()

    return (
        <motion.div
            layoutId={`card-${dataset.id}-${uniqueId}`}
            onClick={() => onSelect(dataset)}
            className={`relative h-full ${isListView ? "w-full" : "h-full"}`}
        >
            <Card className={`h-full overflow-hidden cursor-pointer hover:bg-accent/50 hover:border-primary/20 transition-all duration-200 border border-border/40 py-0 gap-0 shadow-none bg-card/50 ${isListView ? "w-full" : "flex flex-col"}`}>
                {isListView ? <ListCardView dataset={dataset} /> : <GridCardView dataset={dataset} />}
            </Card>
        </motion.div>
    )
})
DatasetCard.displayName = "DatasetCard"


// --- EXPANDED MODAL VIEW ---

const ExpandedCardView = ({ dataset, detailData }: { dataset: DatasetInfo, detailData: DetailedDatasetInfo | null }) => {
    const { uniqueId } = useDatasetCardContext()
    const stats = detailData?.statistics

    const renderDetailItem = (label: string, value: React.ReactNode, icon?: React.ReactNode) => (
        <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                {icon}
                {label}
            </div>
            <div className="text-sm font-semibold">{value}</div>
        </div>
    )

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-start justify-between p-6 border-b bg-muted/30">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div layoutId={`title-${dataset.id}-${uniqueId}`}><CardTitle className="text-xl font-bold">{dataset.name}</CardTitle></motion.div>
                        <motion.div layoutId={`badge-${dataset.id}-${uniqueId}`}><Badge variant="secondary" className="text-xs px-2 py-1">v{dataset.version}</Badge></motion.div>
                    </div>
                    <motion.div layoutId={`description-${dataset.id}-${uniqueId}`}><CardDescription className="text-sm">{dataset.description}</CardDescription></motion.div>
                </div>
                <div className="ml-4 flex-shrink-0"><ActionButtons datasetId={dataset.id} /></div>
            </header>

            <main className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Dataset Overview */}
                <section>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <IconDatabase className="h-4 w-4" />
                        Dataset Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderDetailItem(
                            "File Size",
                            stats?.size_formatted || dataset.fileSize,
                            <IconFileCode className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {renderDetailItem(
                            "Total Rows",
                            stats ? stats.row_count.toLocaleString() : "-",
                            <IconDatabase className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {renderDetailItem(
                            "Total Columns",
                            stats ? stats.column_count : "-",
                            <IconColumns className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {renderDetailItem(
                            "Last Updated",
                            formatDate(dataset.lastUpdatedTimestamp),
                            <IconCalendar className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                    </div>
                </section>

                {/* Statistics Metadata */}
                {stats && (
                    <section className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <IconClock className="h-3 w-3" />
                                Statistics Information
                            </h4>
                            <Badge variant="outline" className="text-[10px]">
                                {stats.metadata.profiling_method}
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Computed {formatRelativeTime(stats.computed_at)} • 
                            Scan time: {stats.metadata.profiling_duration_ms}ms •
                            {stats.metadata.sampling_applied 
                                ? ` Sample size: ${stats.metadata.sample_size.toLocaleString()} rows`
                                : " Full dataset scan"
                            }
                        </div>
                    </section>
                )}

                {/* Column Statistics */}
                {stats && Object.keys(stats.columns).length > 0 && (
                    <section>
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <IconColumns className="h-4 w-4" />
                            Column Information ({Object.keys(stats.columns).length} columns)
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {Object.entries(stats.columns).map(([columnName, columnStats]) => (
                                <div key={columnName} className="bg-muted/20 rounded-lg p-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{columnName}</div>
                                            <Badge variant="secondary" className="text-[10px] mt-1">
                                                {formatDataType(columnStats.data_type)}
                                            </Badge>
                                        </div>
                                        {columnStats.nullable && (
                                            <div className="text-xs text-muted-foreground">
                                                {columnStats.null_count > 0 ? (
                                                    <span className="text-orange-600 dark:text-orange-400">
                                                        {columnStats.null_count.toLocaleString()} nulls ({columnStats.null_percentage.toFixed(2)}%)
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 dark:text-green-400">No nulls</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {(columnStats.min_value !== null || columnStats.max_value !== null) && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                            <div>
                                                <span className="text-muted-foreground">Min: </span>
                                                <span className="font-mono">
                                                    {formatValue(columnStats.min_value, columnStats.data_type)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Max: </span>
                                                <span className="font-mono">
                                                    {formatValue(columnStats.max_value, columnStats.data_type)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Tags */}
                <section>
                    <h3 className="text-sm font-semibold mb-3">Tags</h3>
                    <motion.div layoutId={`tags-${dataset.id}-${uniqueId}`}>
                        <TagsDisplay tags={dataset.tags} isExpanded />
                    </motion.div>
                </section>

                {/* Additional Info */}
                <section className="pt-4 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <IconUser className="h-3 w-3" />
                            <span>Uploaded by {dataset.uploader}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <IconFileCode className="h-3 w-3" />
                            <span>{dataset.fileType.toUpperCase()}</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

// --- UTILITIES ---
const formatDataType = (type: string): string => {
    const typeMap: Record<string, string> = {
        'int64': 'Integer',
        'int32': 'Integer', 
        'double': 'Decimal',
        'float': 'Decimal',
        'string': 'Text',
        'bool': 'Boolean',
        'date32[day]': 'Date',
        'timestamp[ns]': 'Timestamp'
    }
    return typeMap[type] || type
}

const formatValue = (value: unknown, dataType: string): React.ReactNode => {
    if (value === null || value === undefined) return <em className="text-muted-foreground">null</em>
    
    // Handle dates
    if (dataType.includes('date') || dataType.includes('timestamp')) {
        return new Date(String(value)).toLocaleDateString()
    }
    
    // Handle numbers
    if (dataType.includes('int') || dataType.includes('double') || dataType.includes('float')) {
        if (typeof value === 'number') {
            return value.toLocaleString()
        }
    }
    
    // Handle long strings
    if (typeof value === 'string' && value.length > 50) {
        return (
            <span title={value}>
                {value.substring(0, 47)}...
            </span>
        )
    }
    
    // Handle booleans
    if (dataType === 'bool') {
        return value ? '✓ True' : '✗ False'
    }
    
    return String(value)
}

const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    if (days < 30) return `${days} days ago`
    
    return date.toLocaleDateString()
}

// --- MAIN COMPONENT ---
interface ExpandableDatasetCardProps {
    datasets: DatasetInfo[]
    onView: (id: number) => void
    onDownload: (id: number) => void
    onSave: (id: number) => void
    isList?: boolean
}

export function ExpandableDatasetCard({
                                          datasets,
                                          onView,
                                          onDownload,
                                          onSave,
                                          isList = false,
                                      }: ExpandableDatasetCardProps) {
    const [active, setActive] = useState<DatasetInfo | null>(null)
    const [detailData, setDetailData] = useState<DetailedDatasetInfo | null>(null)
    const id = useId()
    const modalRef = useRef<HTMLDivElement>(null)
    
    // Fetch statistics when a dataset is selected
    const { data: statistics, isLoading } = useDatasetStatistics(
        active?.id,
        undefined, // Get latest version statistics
        {
            enabled: !!active,
            staleTime: 5 * 60 * 1000, // 5 minutes
        }
    )

    // IMPROVEMENT: `onSelect` is wrapped in `useCallback` to be stable for context
    const handleSelect = useCallback((dataset: DatasetInfo) => {
        setActive(dataset)
    }, [])

    // IMPROVEMENT: `closeDetailView` is wrapped in `useCallback`
    const closeDetailView = useCallback(() => {
        document.body.style.overflow = "auto"
        setActive(null)
        setDetailData(null)
    }, [])

    // Update detail data when statistics are loaded
    useEffect(() => {
        if (active && statistics) {
            setDetailData({
                id: active.id,
                statistics,
            })
        } else if (active && !statistics) {
            setDetailData({
                id: active.id,
                statistics: null,
            })
        }
    }, [active, statistics])

    // IMPROVEMENT: Centralized effect for body overflow and escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeDetailView()
        }

        if (active) {
            document.body.style.overflow = "hidden"
            window.addEventListener("keydown", handleKeyDown)
        }

        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [active, closeDetailView])

    useOutsideClick(modalRef as React.RefObject<HTMLDivElement>, closeDetailView)

    // IMPROVEMENT: Context provider wraps the list
    const contextValue = { onSave, onView, onDownload, onSelect: handleSelect, uniqueId: id }

    return (
        <DatasetCardContext.Provider value={contextValue}>
            <AnimatePresence mode="wait">
                {active && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {active && (
                    <div className="fixed inset-0 grid place-items-center z-50">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute top-4 right-4 flex items-center justify-center bg-card text-card-foreground rounded-full h-8 w-8 shadow-lg border hover:bg-accent transition-colors"
                            onClick={closeDetailView}
                            aria-label="Close detail view"
                        >
                            <IconX className="h-4 w-4" />
                        </motion.button>

                        <motion.div
                            layoutId={`card-${active.id}-${id}`}
                            ref={modalRef}
                            className="w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] flex flex-col bg-card sm:rounded-2xl shadow-2xl border overflow-hidden"
                            transition={{ 
                                type: "spring",
                                damping: 30,
                                stiffness: 300
                            }}
                        >
                            <ExpandedCardView dataset={active} detailData={detailData} />
                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center">
                                    <div className="text-center space-y-2">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                        <p className="text-sm text-muted-foreground">Loading statistics...</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* List Rendering */}
            {datasets.map((dataset) => (
                <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    isListView={isList}
                />
            ))}
        </DatasetCardContext.Provider>
    )
}