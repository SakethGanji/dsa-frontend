import React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Download, Copy, Text, Hash, Calendar, ToggleLeft } from "lucide-react"
import type { SamplingResult } from "@/lib/api/types"

interface ResultsTableProps {
  data: SamplingResult[]
  outputName: string
  method: string
  onDownload?: () => void
  onCopyToClipboard?: () => void
  currentPage?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  isLoading?: boolean
}

// Helper function to detect column type
function getColumnType(values: any[]): "text" | "number" | "date" | "boolean" {
  const sample = values.filter(v => v !== null && v !== undefined).slice(0, 10)
  
  if (sample.every(v => typeof v === 'boolean')) return "boolean"
  
  if (sample.every(v => typeof v === 'number' || !isNaN(Number(v)))) return "number"
  
  if (sample.every(v => {
    const date = new Date(v)
    return date instanceof Date && !isNaN(date.getTime()) && v.toString().match(/\d{4}-\d{2}-\d{2}/)
  })) return "date"
  
  return "text"
}

// Helper function to get icon for column type
function getColumnIcon(type: string) {
  switch (type) {
    case "number":
      return Hash
    case "date":
      return Calendar
    case "boolean":
      return ToggleLeft
    default:
      return Text
  }
}

// Helper function to format cell value
function formatCellValue(value: any, type: string) {
  if (value === null || value === undefined) return '-'
  
  if (type === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {value ? "True" : "False"}
      </Badge>
    )
  }
  
  if (type === "date" && value) {
    return new Date(value).toLocaleDateString()
  }
  
  return String(value)
}

export function ResultsTable({ 
  data, 
  outputName, 
  method,
  onDownload,
  onCopyToClipboard,
  currentPage = 1,
  pageSize = 50,
  totalItems,
  onPageChange,
  onPageSizeChange,
  isLoading = false
}: ResultsTableProps) {
  // Extract columns from the first row of data
  const columns = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }, [data])
  
  // Get column types
  const columnTypes = React.useMemo(() => {
    if (!data || data.length === 0) return {}
    
    const types: Record<string, string> = {}
    columns.forEach(col => {
      const values = data.map(row => row[col])
      types[col] = getColumnType(values)
    })
    return types
  }, [data, columns])

  // Calculate total pages for server-side pagination
  const totalPages = totalItems && pageSize ? Math.ceil(totalItems / pageSize) : 1

  if (!data || data.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No sampling results yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Execute a sampling operation to see results</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Results Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">{outputName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700">
                {method} sampling
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalItems ? `${totalItems} total rows` : `${data.length} rows`}
              </Badge>
              {totalItems && totalItems > pageSize && (
                <Badge variant="secondary" className="text-xs">
                  Page {currentPage} of {totalPages}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {columns.length} columns
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCopyToClipboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyToClipboard}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Simple Table */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          </div>
        )}
        
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                {columns.map((column) => {
                  const Icon = getColumnIcon(columnTypes[column])
                  return (
                    <TableHead key={column} className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span>{column}</span>
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column} className="text-sm">
                      {formatCellValue(row[column], columnTypes[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        {/* Custom Server-side Pagination */}
        {totalItems && totalItems > pageSize && onPageChange && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalItems)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalItems}</span>
                {' '}results
              </p>
              {onPageSizeChange && (
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="ml-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      disabled={isLoading}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}