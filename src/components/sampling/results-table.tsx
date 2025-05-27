import React from "react"
import { motion } from "framer-motion"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar"
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list"
import { DataTableSortList } from "@/components/data-table/data-table-sort-list"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { useDataTable } from "@/hooks/use-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Copy, Text, Hash, Calendar, ToggleLeft } from "lucide-react"
import type { SamplingResult } from "@/lib/api/types"

interface ResultsTableProps {
  data: SamplingResult[]
  outputName: string
  method: string
  onDownload?: () => void
  onCopyToClipboard?: () => void
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

export function ResultsTable({ 
  data, 
  outputName, 
  method,
  onDownload,
  onCopyToClipboard
}: ResultsTableProps) {
  // Extract columns from the first row of data
  const columns = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    const firstRow = data[0]
    return Object.keys(firstRow).map((key) => {
      const columnValues = data.map(row => row[key])
      const columnType = getColumnType(columnValues)
      const Icon = getColumnIcon(columnType)
      
      return {
        id: key,
        accessorKey: key,
        header: ({ column }: { column: { id: string; toggleSorting: (desc?: boolean) => void } }) => (
          <DataTableColumnHeader column={column} title={key} />
        ),
        cell: ({ row }: { row: { getValue: (id: string) => unknown } }) => {
          const value = row.getValue(key)
          
          // Format based on column type
          if (columnType === "boolean") {
            return (
              <Badge variant={value ? "default" : "secondary"} className="text-xs">
                {value ? "True" : "False"}
              </Badge>
            )
          }
          
          if (columnType === "date" && value) {
            return <div className="text-xs min-w-[100px] px-2">{new Date(value as string).toLocaleDateString()}</div>
          }
          
          return <div className="text-xs min-w-[100px] px-2">{value?.toString() || '-'}</div>
        },
        size: 150,
        minSize: 100,
        meta: {
          label: key,
          placeholder: `Search ${key}...`,
          variant: columnType,
          icon: Icon,
        },
        enableColumnFilter: true,
        enableSorting: true,
      }
    })
  }, [data])

  // Initialize data table with advanced features
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.ceil(data.length / 10),
    initialState: {
      pagination: { 
        pageIndex: 0,
        pageSize: 10 
      },
    },
    getRowId: (_row: unknown, index: number) => index.toString(),
    // Enable advanced filtering
    enableAdvancedFilter: true,
  })


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
                {data.length} rows
              </Badge>
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

      {/* Data Table with Advanced Features */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <DataTable table={table} className="min-w-full">
          <DataTableAdvancedToolbar table={table} className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b">
            <DataTableFilterList table={table} />
            <DataTableSortList table={table} />
          </DataTableAdvancedToolbar>
        </DataTable>
      </div>
    </motion.div>
  )
}