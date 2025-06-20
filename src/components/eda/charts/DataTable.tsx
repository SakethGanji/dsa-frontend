import { useState } from "react"
import { motion } from "framer-motion"
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
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TableData } from "../types"

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

  // Filter rows based on search
  const filteredRows = data.rows.filter(row => 
    row.some(cell => 
      cell?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const totalPages = Math.ceil(filteredRows.length / pageSize)
  const startIndex = currentPage * pageSize
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize)

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(0)
            }}
            className="pl-9 bg-background border-input focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30">
              {data.columns.map((column, idx) => (
                <TableHead key={idx} className="font-medium text-foreground">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={data.columns.length} 
                  className="text-center text-muted-foreground py-8"
                >
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, rowIdx) => (
                <motion.tr
                  key={startIndex + rowIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIdx * 0.02 }}
                  className="border-b border-border transition-colors hover:bg-accent/50 data-[state=selected]:bg-accent"
                >
                  {row.map((cell, cellIdx) => (
                    <TableCell key={cellIdx}>
                      {typeof cell === 'number' 
                        ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : cell}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredRows.length)} of {filteredRows.length} results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}