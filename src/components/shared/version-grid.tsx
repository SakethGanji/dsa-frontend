import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitBranch, Check, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import type { DatasetVersion } from "@/lib/api/types"
import { formatByteSize } from "@/lib/utils"

interface VersionGridProps {
  versions: DatasetVersion[] | undefined
  selectedVersion: DatasetVersion | null
  onVersionSelect: (version: DatasetVersion) => void
  isActive: boolean
  isCompleted: boolean
  isLoading: boolean
  datasetName?: string
}

export function VersionGrid({
  versions,
  selectedVersion,
  onVersionSelect,
  isActive,
  isCompleted,
  isLoading,
  datasetName
}: VersionGridProps) {
  return (
    <Card
      className={`transition-all duration-300 ${
        isActive
          ? "border-primary/50 shadow-lg dark:shadow-primary/10 bg-card"
          : isCompleted
            ? "bg-card/50 border-border/50 opacity-75"
            : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isCompleted
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isCompleted ? <Check className="w-6 h-6" /> : <GitBranch className="w-6 h-6" />}
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Dataset Versions</CardTitle>
            <CardDescription className="text-sm mt-1">
              Choose a version of {datasetName || "your dataset"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {versions?.map((version, index) => {
              const isSelected = selectedVersion?.id === version.id
              const isSelectable = !isCompleted

              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={isSelectable ? { scale: 1.02 } : {}}
                  whileTap={isSelectable ? { scale: 0.98 } : {}}
                >
                  <Card
                    className={`h-full transition-all duration-300 relative overflow-hidden group ${
                      isSelected && isCompleted
                        ? "border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-md"
                        : isSelected
                          ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-lg shadow-primary/10"
                          : isCompleted
                            ? "opacity-50 cursor-default bg-card/50"
                            : "cursor-pointer hover:shadow-md hover:border-primary/30 hover:bg-accent/50 dark:hover:bg-accent/20 bg-card border-border"
                    }`}
                    onClick={isSelectable ? () => onVersionSelect(version) : undefined}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
                    <CardContent className="p-4 relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge className="text-xs px-2.5 py-0.5 font-semibold" variant="default">
                              v{version.version_number}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2.5 py-0.5">
                              {(version.overlay_file_type || version.materialized_file_type || version.file_type)?.toUpperCase()}
                            </Badge>
                            {version.status && (
                              <Badge variant={version.status === 'active' ? 'secondary' : 'outline'} className="text-xs px-2 py-0.5">
                                {version.status}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            {format(new Date(version.created_at || version.ingestion_timestamp || ''), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {isSelected && isCompleted && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="bg-primary rounded-full p-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </motion.div>
                        )}
                        {isSelectable && (
                          <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-primary"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-sm font-medium">
                          {formatByteSize(version.overlay_file_size || version.materialized_file_size || version.file_size)}
                        </p>
                        {version.message && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {version.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}