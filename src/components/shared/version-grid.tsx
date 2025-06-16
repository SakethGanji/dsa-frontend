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
      className={`transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-primary/40 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 ring-1 ring-primary/20"
          : isCompleted
            ? "bg-card/70 border-border/50 opacity-80"
            : ""
      }`}
    >
      <CardHeader className="pb-2 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isCompleted
                ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                : isActive
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isCompleted ? <Check className="w-6 h-6" /> : <GitBranch className="w-6 h-6" />}
          </motion.div>
          <div>
            <CardTitle className="text-xl font-semibold">Dataset Versions</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Choose a version of {datasetName || "your dataset"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-2">
        {isLoading ? (
          <div className="text-center py-8">
            <motion.div
              className="relative w-16 h-16 mx-auto mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-primary/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-4 border-t-primary border-r-primary/50 border-b-transparent border-l-transparent rounded-full"
              />
            </motion.div>
            <p className="text-sm font-medium text-muted-foreground">Loading versions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                    className={`h-full transition-all duration-300 relative overflow-hidden group min-h-0 py-0 gap-0 ${
                      isSelected && isCompleted
                        ? "border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg ring-1 ring-primary/20"
                        : isSelected
                          ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-xl shadow-primary/20 ring-2 ring-primary/30"
                          : isCompleted
                            ? "opacity-60 cursor-default bg-card/60 border-border/40"
                            : "cursor-pointer hover:shadow-lg hover:border-primary/40 hover:bg-gradient-to-br hover:from-card hover:to-primary/5 bg-card border-border/60"
                    }`}
                    onClick={isSelectable ? () => onVersionSelect(version) : undefined}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000" />
                    <CardContent className="p-3 relative">
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
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
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
                      <div className="mt-1.5 pt-1.5 border-t border-border/50">
                        <p className="text-sm font-medium">
                          {formatByteSize(version.overlay_file_size || version.materialized_file_size || version.file_size)}
                        </p>
                        {version.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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