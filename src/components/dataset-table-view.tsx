"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/index"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Keys for caching queries
const SHEETS_QUERY_KEY = "dataset-sheets"
const DATA_QUERY_KEY = "sheet-data"

interface DataTableProps {
  datasetId: number
  versionId: number
}

export function DatasetTableView({ datasetId, versionId }: DataTableProps) {
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Fetch available sheets
  const sheetsQuery = useQuery({
    queryKey: [SHEETS_QUERY_KEY, datasetId, versionId],
    queryFn: () => api.datasets.versions.listSheets(datasetId, versionId),
    enabled: !!datasetId && !!versionId,
  })

  // Set the first sheet as selected when sheets load
  useEffect(() => {
    if (sheetsQuery.data && sheetsQuery.data.length > 0 && !selectedSheetId) {
      setSelectedSheetId(sheetsQuery.data[0].id)
    }
  }, [sheetsQuery.data, selectedSheetId])

  // Fetch sheet data with server-side pagination
  const dataQuery = useQuery({
    queryKey: [DATA_QUERY_KEY, datasetId, versionId, selectedSheetId, page, pageSize],
    queryFn: () => 
      api.datasets.versions.getData(datasetId, versionId, {
        sheet_id: selectedSheetId,
        limit: pageSize,
        offset: page * pageSize,
      }),
    enabled: !!datasetId && !!versionId && !!selectedSheetId,
  })

  // Handle pagination
  const handleNextPage = () => {
    if (dataQuery.data?.has_more) {
      setPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1)
    }
  }

  const handleSheetChange = (sheetId: string) => {
    setSelectedSheetId(Number(sheetId))
    setPage(0) // Reset to first page when changing sheets
  }

  return (
    <div className="space-y-4">
      {/* Sheet selector */}
      {sheetsQuery.isLoading ? (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-48" />
        </div>
      ) : sheetsQuery.isError ? (
        <div className="text-destructive">Error loading sheets: {sheetsQuery.error.message}</div>
      ) : sheetsQuery.data && sheetsQuery.data.length > 0 ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Select Sheet:</span>
            <Select
              value={selectedSheetId?.toString()}
              onValueChange={handleSheetChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheetsQuery.data.map(sheet => (
                  <SelectItem key={sheet.id} value={sheet.id.toString()}>
                    {sheet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center">
              <FileDown className="h-4 w-4 mr-1" /> Download Data
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setPage(0) // Reset to first page when changing page size
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">No sheets available for this dataset version</div>
      )}

      {/* Data table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 py-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Dataset Preview</span>
              {selectedSheetId && sheetsQuery.data && (
                <Badge variant="outline">
                  {sheetsQuery.data.find(s => s.id === selectedSheetId)?.name || "Sheet"}
                </Badge>
              )}
            </div>
            {dataQuery.data && (
              <div className="text-sm font-normal text-muted-foreground">
                Showing {page * pageSize + 1} to {page * pageSize + (dataQuery.data.rows?.length || 0)} of 
                {dataQuery.data.total ? ` ${dataQuery.data.total}` : dataQuery.data.has_more ? " many" : ` ${page * pageSize + (dataQuery.data.rows?.length || 0)}`} rows
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dataQuery.isLoading ? (
            <div className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : dataQuery.isError ? (
            <div className="p-4 text-destructive">Error loading data: {dataQuery.error.message}</div>
          ) : dataQuery.data ? (
            <>
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {dataQuery.data.headers?.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataQuery.data.rows?.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {dataQuery.data.headers?.map((header, colIndex) => (
                          <TableCell key={colIndex}>
                            {row[header] !== null && row[header] !== undefined 
                              ? String(row[header]) 
                              : <span className="text-muted-foreground italic">null</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={page === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={!dataQuery.data?.has_more}
                  className="flex items-center"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Select a sheet to view data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}