import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Database } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataPreviewTableProps {
  data: {
    headers: string[]
    rows: Record<string, unknown>[]
    total_count: number
  } | null
  isLoading: boolean
  className?: string
}

export function DataPreviewTable({ data, isLoading, className }: DataPreviewTableProps) {
  // Format cell value based on type
  const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground/50">-</span>
    if (typeof value === 'object') return JSON.stringify(value)
    return value.toString()
  }
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-20", className)}>
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary/30 border-r-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preview data...</p>
        </div>
      </div>
    )
  }
  
  if (!data || !data.headers || data.headers.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-20", className)}>
        <div className="text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("w-full", className)}>
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 border-b">
                <TableRow>
                  <TableHead className="w-12 font-medium text-muted-foreground">#</TableHead>
                  {data.headers.map((header: string) => (
                    <TableHead key={header} className="font-medium min-w-[120px]">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.slice(0, 10).map((row: Record<string, unknown>, rowIndex: number) => (
                  <TableRow key={rowIndex} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {rowIndex + 1}
                    </TableCell>
                    {data.headers.map((header: string) => (
                      <TableCell key={header} className="font-mono text-sm">
                        {formatCellValue(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>
      {data.total_count > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Showing 10 of {data.total_count.toLocaleString()} rows
          </p>
        </div>
      )}
    </div>
  )
}