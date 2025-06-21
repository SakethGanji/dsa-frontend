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
    additionalDetails: {
        rowCount: number
        columnCount: number
        createdAt: string
        lastAccessed: string
        format: string
        encoding: string
        validationStatus: string
    }
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

const formatDetailKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())


// --- REUSABLE SUB-COMPONENTS (MEMOIZED) ---

const ActionButtons = memo(({ datasetId }: { datasetId: number }) => {
    // IMPROVEMENT: Gets handlers from context instead of props
    const { onView, onDownload, onSave, uniqueId } = useDatasetCardContext()

    const stopPropagationAndCall = (fn: (id: number) => void) => (e: React.MouseEvent) => {
        e.stopPropagation()
        fn(datasetId)
    }

    return (
        <motion.div layoutId={`actions-${datasetId}-${uniqueId}`} className="flex gap-0.5">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-destructive/10" onClick={stopPropagationAndCall(onSave)} aria-label="Save">
                    <IconBookmark className="h-3.5 w-3.5 text-destructive" stroke={2} />
                </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-blue-500/10" onClick={stopPropagationAndCall(onDownload)} aria-label="Download">
                    <IconCloudDownload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" stroke={2} />
                </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-green-500/10" onClick={stopPropagationAndCall(onView)} aria-label="View">
                    <IconArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" stroke={2} />
                </Button>
            </motion.div>
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
                        <motion.div layoutId={`title-${dataset.id}-${uniqueId}`}><CardTitle className="text-sm font-semibold leading-tight">{dataset.name}</CardTitle></motion.div>
                        <motion.div layoutId={`badge-${dataset.id}-${uniqueId}`}><Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">v{dataset.version}</Badge></motion.div>
                    </div>
                    <motion.div layoutId={`description-${dataset.id}-${uniqueId}`}><CardDescription className="text-xs leading-tight mb-1.5 line-clamp-1">{dataset.description}</CardDescription></motion.div>
                    <motion.div layoutId={`metadata-${dataset.id}-${uniqueId}`} className="flex flex-wrap items-center gap-2 text-[11px]">
                        <TypeInfo fileType={dataset.fileType} fileSize={dataset.fileSize} />
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-0.5 text-muted-foreground"><IconCalendar className="h-2.5 w-2.5" stroke={1.5} /><span>{formatDate(dataset.lastUpdatedTimestamp)}</span></div>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-0.5 text-muted-foreground"><IconUser className="h-2.5 w-2.5" stroke={1.5} /><span>{dataset.uploader}</span></div>
                    </motion.div>
                </div>
                <motion.div layoutId={`tags-${dataset.id}-${uniqueId}`} className="hidden md:block">
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

    const renderDetailItem = (label: string, value: React.ReactNode, icon?: React.ReactNode) => (
        <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="flex items-center gap-1 text-sm font-medium">{icon}{value}</div>
        </div>
    )

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-start justify-between p-4 border-b">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div layoutId={`title-${dataset.id}-${uniqueId}`}><CardTitle className="text-lg font-bold">{dataset.name}</CardTitle></motion.div>
                        <motion.div layoutId={`badge-${dataset.id}-${uniqueId}`}><Badge variant="secondary" className="text-xs px-2 py-1">v{dataset.version}</Badge></motion.div>
                    </div>
                    <motion.div layoutId={`description-${dataset.id}-${uniqueId}`}><CardDescription className="text-sm">{dataset.description}</CardDescription></motion.div>
                </div>
                <div className="ml-4 flex-shrink-0"><ActionButtons datasetId={dataset.id} /></div>
            </header>

            <main className="flex-1 p-4 space-y-4 overflow-y-auto">
                <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderDetailItem("File Info", <motion.div layoutId={`metadata-${dataset.id}-${uniqueId}`}><TypeInfo fileType={dataset.fileType} fileSize={dataset.fileSize} /></motion.div>)}
                    {renderDetailItem("Last Updated", formatDate(dataset.lastUpdatedTimestamp), <IconCalendar className="h-3.5 w-3.5 text-muted-foreground" />)}
                    {renderDetailItem("Uploader", <span className="truncate">{dataset.uploader}</span>, <IconUser className="h-3.5 w-3.5 text-muted-foreground" />)}
                    {detailData && renderDetailItem("Rows", detailData.additionalDetails.rowCount.toLocaleString())}
                    {detailData && renderDetailItem("Columns", detailData.additionalDetails.columnCount)}
                </section>
                <section className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</h3>
                    <motion.div layoutId={`tags-${dataset.id}-${uniqueId}`}><TagsDisplay tags={dataset.tags} isExpanded /></motion.div>
                </section>
                {detailData?.additionalDetails && (
                    <section className="space-y-3 pt-3 border-t">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Technical Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(detailData.additionalDetails)
                                .filter(([key]) => !['rowCount', 'columnCount'].includes(key))
                                .map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center text-xs py-1.5 px-2 rounded-md bg-muted/50">
                                        <span className="text-muted-foreground capitalize">{formatDetailKey(key)}</span>
                                        <span className="font-medium">{String(value)}</span>
                                    </div>
                                ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}

// --- MOCK API ---
const fetchDetailedDataset = async (datasetId: number): Promise<DetailedDatasetInfo> => {
    console.log(`Fetching details for dataset ${datasetId}...`)
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: datasetId,
                additionalDetails: {
                    rowCount: Math.floor(Math.random() * 100000) + 5000,
                    columnCount: Math.floor(Math.random() * 50) + 10,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
                    lastAccessed: new Date().toISOString(),
                    format: "CSV",
                    encoding: "UTF-8",
                    validationStatus: "Passed",
                }
            })
        }, 300)
    })
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
    const [isLoading, setIsLoading] = useState(false)
    const id = useId()
    const modalRef = useRef<HTMLDivElement>(null)

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

    // IMPROVEMENT: Side effect for fetching data is in `useEffect`, not the click handler
    useEffect(() => {
        if (!active) return

        let isCancelled = false
        const fetchData = async () => {
            setIsLoading(true)
            setDetailData(null) // Clear old data
            try {
                const data = await fetchDetailedDataset(active.id)
                if (!isCancelled) {
                    setDetailData(data)
                }
            } catch (error) {
                console.error("Failed to fetch dataset details:", error)
                if (!isCancelled) {
                    // Optionally close or show an error state
                    closeDetailView()
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false)
                }
            }
        }

        fetchData()

        return () => { isCancelled = true }
    }, [active, closeDetailView])

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

    useOutsideClick(modalRef, closeDetailView)

    // IMPROVEMENT: Context provider wraps the list
    const contextValue = { onSave, onView, onDownload, onSelect: handleSelect, uniqueId: id }

    return (
        <DatasetCardContext.Provider value={contextValue}>
            <AnimatePresence>
                {active && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {active && (
                    <div className="fixed inset-0 grid place-items-center z-50">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            // IMPROVEMENT: Fixed button dimensions
                            className="absolute top-4 right-4 flex items-center justify-center bg-card text-card-foreground rounded-full h-7 w-7 shadow-lg border"
                            onClick={closeDetailView}
                            aria-label="Close detail view"
                        >
                            <IconArrowUpRight className="h-4 w-4 rotate-180" /> {/* A close icon would be better */}
                        </motion.button>

                        <motion.div
                            layoutId={`card-${active.id}-${id}`}
                            ref={modalRef}
                            className="w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] flex flex-col bg-card sm:rounded-2xl shadow-2xl border"
                        >
                            <ExpandedCardView dataset={active} detailData={detailData} />
                            {/* Optional: Add a loading indicator */}
                            {isLoading && <div className="absolute inset-0 bg-card/50 flex items-center justify-center"><p>Loading...</p></div>}
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