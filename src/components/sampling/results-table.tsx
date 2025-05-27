import React from "react"
import { motion } from "framer-motion"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useDataTable } from "@/hooks/use-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Copy, Text } from "lucide-react"
import type { SamplingResult } from "@/lib/api/types"

interface ResultsTableProps {
  data: SamplingResult[]
  outputName: string
  method: string
  onDownload?: () => void
  onCopyToClipboard?: () => void
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
    return Object.keys(firstRow).map((key) => ({
      id: key,
      accessorKey: key,
      header: ({ column }: { column: { id: string; toggleSorting: (desc?: boolean) => void } }) => (
        <DataTableColumnHeader column={column} title={key} />
      ),
      cell: ({ row }: { row: { getValue: (id: string) => unknown } }) => {
        const value = row.getValue(key)
        return <div className="text-xs min-w-[100px] px-2">{value?.toString() || '-'}</div>
      },
      size: 150,
      minSize: 100,
      meta: {
        label: key,
        placeholder: `Search ${key}...`,
        variant: "text" as const,
        icon: Text,
      },
      enableColumnFilter: true,
      enableSorting: true,
    }))
  }, [data])

  // Initialize data table
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

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <DataTable table={table} className="min-w-full">
          <DataTableToolbar table={table} className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b" />
        </DataTable>
      </div>
    </motion.div>
  )
}