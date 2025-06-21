import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, SortAsc, SortDesc } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TableData } from "../types"
import { Card, CardContent } from "@/components/ui/card"

interface DataTableProps {
  data: TableData
  title?: string
  description?: string
  className?: string
  pageSize?: number
}

export function DataTable({ 
  data, 
  title, 
  description, 
  className, 
  pageSize = 10 
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ column: number; direction: 'asc' | 'desc' } | null>(null)

  // Filter and sort rows
  let processedRows = data.rows.filter(row => 
    row.some(cell => 
      cell?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Apply sorting
  if (sortConfig) {
    processedRows = [...processedRows].sort((a, b) => {
      const aVal = a[sortConfig.column]
      const bVal = b[sortConfig.column]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortConfig.direction === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }

  const filteredRows = processedRows

  const totalPages = Math.ceil(filteredRows.length / pageSize)
  const startIndex = currentPage * pageSize
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize)

  const handleSort = (columnIndex: number) => {
    setSortConfig(current => {
      if (!current || current.column !== columnIndex) {
        return { column: columnIndex, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { column: columnIndex, direction: 'desc' }
      }
      return null
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("space-y-4", className)}
    >
      {title && (
        <div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {description}
            </p>
          )}
        </div>
      )}

      <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardContent className="p-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(0)
                }}
                className="pl-9 bg-muted/50 border-muted-foreground/20 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-muted-foreground/10 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-muted-foreground/10 bg-gradient-to-r from-muted/50 to-transparent">
                  {data.columns.map((column, idx) => (
                    <TableHead 
                      key={idx} 
                      className="font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => handleSort(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{column}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.column === idx ? (
                            sortConfig.direction === 'asc' ? (
                              <SortAsc className="h-4 w-4 text-primary" />
                            ) : (
                              <SortDesc className="h-4 w-4 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="wait">
                  {paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell 
                        colSpan={data.columns.length} 
                        className="text-center text-muted-foreground py-12"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>No results found</p>
                          <p className="text-xs mt-1">Try adjusting your search</p>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row, rowIdx) => (
                      <motion.tr
                        key={`${currentPage}-${rowIdx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ 
                          delay: rowIdx * 0.03,
                          duration: 0.2
                        }}
                        className="border-b border-muted-foreground/5 transition-all hover:bg-primary/5 group"
                      >
                        {row.map((cell, cellIdx) => (
                          <TableCell 
                            key={cellIdx}
                            className="py-4 transition-colors group-hover:text-foreground"
                          >
                            {typeof cell === 'number' ? (
                              <span className="font-mono font-medium">
                                {cell.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span>{cell}</span>
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mt-6 pt-6 border-t border-muted-foreground/10"
            >
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{' '}
                <span className="font-medium text-foreground">{Math.min(startIndex + pageSize, filteredRows.length)}</span> of{' '}
                <span className="font-medium text-foreground">{filteredRows.length}</span> results
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="border-muted-foreground/20 hover:bg-primary/10 hover:border-primary/50 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 1))
                    const isActive = pageNum === currentPage
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-9 h-9 p-0",
                          isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {pageNum + 1}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="border-muted-foreground/20 hover:bg-primary/10 hover:border-primary/50 transition-all"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}