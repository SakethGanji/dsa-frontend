"use client"

import React from "react"

import { DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect, useRef } from "react"
import {
  Play,
  Save,
  Database,
  Columns,
  RowsIcon,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Eye,
  Download,
  Settings,
  Command,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  Code,
  TableIcon,
  Activity,
  GripVertical,
  History,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  FileText,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"

// Mock data
const mockDatasets = [
  {
    id: "sales_2024",
    name: "Sales Data 2024",
    rows: 15420,
    columns: 8,
    size: "2.3 MB",
    lastUpdated: "2 hours ago",
    schema: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "customer_name", type: "VARCHAR", nullable: false },
      { name: "product", type: "VARCHAR", nullable: false },
      { name: "amount", type: "DECIMAL", nullable: false },
      { name: "date", type: "DATE", nullable: false },
      { name: "region", type: "VARCHAR", nullable: true },
      { name: "sales_rep", type: "VARCHAR", nullable: true },
      { name: "status", type: "VARCHAR", nullable: false },
    ],
  },
  {
    id: "customers",
    name: "Customer Database",
    rows: 3250,
    columns: 6,
    size: "890 KB",
    lastUpdated: "1 day ago",
    schema: [
      { name: "customer_id", type: "INTEGER", nullable: false },
      { name: "name", type: "VARCHAR", nullable: false },
      { name: "email", type: "VARCHAR", nullable: false },
      { name: "phone", type: "VARCHAR", nullable: true },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
      { name: "tier", type: "VARCHAR", nullable: false },
    ],
  },
  {
    id: "products",
    name: "Product Catalog",
    rows: 1850,
    columns: 5,
    size: "445 KB",
    lastUpdated: "3 hours ago",
    schema: [
      { name: "product_id", type: "INTEGER", nullable: false },
      { name: "name", type: "VARCHAR", nullable: false },
      { name: "category", type: "VARCHAR", nullable: false },
      { name: "price", type: "DECIMAL", nullable: false },
      { name: "in_stock", type: "BOOLEAN", nullable: false },
    ],
  },
  {
    id: "orders",
    name: "Order History",
    rows: 8920,
    columns: 7,
    size: "1.8 MB",
    lastUpdated: "30 minutes ago",
    schema: [
      { name: "order_id", type: "INTEGER", nullable: false },
      { name: "customer_id", type: "INTEGER", nullable: false },
      { name: "product_id", type: "INTEGER", nullable: false },
      { name: "quantity", type: "INTEGER", nullable: false },
      { name: "order_date", type: "DATE", nullable: false },
      { name: "total_amount", type: "DECIMAL", nullable: false },
      { name: "status", type: "VARCHAR", nullable: false },
    ],
  },
]

const mockQueryResults = [
  { id: 1, customer_name: "Acme Corp", product: "Widget A", amount: 1250.0, date: "2024-01-15", region: "North" },
  { id: 2, customer_name: "Beta Inc", product: "Widget B", amount: 890.5, date: "2024-01-16", region: "South" },
  { id: 3, customer_name: "Gamma LLC", product: "Widget A", amount: 2100.75, date: "2024-01-17", region: "East" },
  { id: 4, customer_name: "Delta Co", product: "Widget C", amount: 675.25, date: "2024-01-18", region: "West" },
  { id: 5, customer_name: "Echo Systems", product: "Widget B", amount: 1450.0, date: "2024-01-19", region: "North" },
]

const sqlTemplates = {
  "Basic Queries": [
    {
      name: "Select All",
      description: "Basic SELECT statement",
      sql: `SELECT *
FROM {table_name}
LIMIT 100;`,
    },
    {
      name: "Select Specific Columns",
      description: "Select only needed columns",
      sql: `SELECT 
  column1,
  column2,
  column3
FROM {table_name}
WHERE condition = 'value'
ORDER BY column1 DESC;`,
    },
    {
      name: "Count Records",
      description: "Count total records",
      sql: `SELECT COUNT(*) as total_records
FROM {table_name};`,
    },
  ],
  Joins: [
    {
      name: "Inner Join",
      description: "Join two tables",
      sql: `SELECT 
  a.column1,
  a.column2,
  b.column3
FROM {table1} a
INNER JOIN {table2} b ON a.id = b.foreign_id;`,
    },
    {
      name: "Left Join",
      description: "Left join with null handling",
      sql: `SELECT 
  a.*,
  b.column1,
  COALESCE(b.column2, 'N/A') as column2_clean
FROM {table1} a
LEFT JOIN {table2} b ON a.id = b.foreign_id;`,
    },
  ],
  Aggregations: [
    {
      name: "Group By Summary",
      description: "Group and aggregate data",
      sql: `SELECT 
  category,
  COUNT(*) as count,
  AVG(amount) as avg_amount,
  SUM(amount) as total_amount,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM {table_name}
GROUP BY category
ORDER BY total_amount DESC;`,
    },
    {
      name: "Window Functions",
      description: "Ranking and running totals",
      sql: `SELECT 
  *,
  ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC) as rank,
  SUM(amount) OVER (PARTITION BY category) as category_total,
  LAG(amount) OVER (ORDER BY date) as previous_amount
FROM {table_name}
ORDER BY date;`,
    },
  ],
  "Data Cleaning": [
    {
      name: "Remove Duplicates",
      description: "Deduplicate records",
      sql: `SELECT DISTINCT
  column1,
  column2,
  column3
FROM {table_name}
-- OR use ROW_NUMBER() for more control
-- SELECT * FROM (
--   SELECT *, ROW_NUMBER() OVER (PARTITION BY column1 ORDER BY date DESC) as rn
--   FROM {table_name}
-- ) WHERE rn = 1;`,
    },
    {
      name: "Handle Nulls",
      description: "Clean null values",
      sql: `SELECT 
  COALESCE(column1, 'Unknown') as column1_clean,
  CASE 
    WHEN column2 IS NULL THEN 0 
    ELSE column2 
  END as column2_clean,
  NULLIF(column3, '') as column3_clean
FROM {table_name}
WHERE column1 IS NOT NULL;`,
    },
  ],
  Filters: [
    {
      name: "Date Range",
      description: "Filter by date range",
      sql: `SELECT *
FROM {table_name}
WHERE date >= '2024-01-01'
  AND date < '2024-12-31'
  AND status IN ('active', 'pending')
ORDER BY date DESC;`,
    },
    {
      name: "Text Search",
      description: "Search text fields",
      sql: `SELECT *
FROM {table_name}
WHERE LOWER(name) LIKE '%search_term%'
   OR description ILIKE '%search_term%'
ORDER BY name;`,
    },
  ],
}

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "integer":
      return <Hash className="w-3 h-3" />
    case "varchar":
      return <Type className="w-3 h-3" />
    case "decimal":
      return <Hash className="w-3 h-3" />
    case "date":
    case "timestamp":
      return <Calendar className="w-3 h-3" />
    case "boolean":
      return <ToggleLeft className="w-3 h-3" />
    default:
      return <Database className="w-3 h-3" />
  }
}

export default function Component() {
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>(["sales_2024"])
  const [sqlQuery, setSqlQuery] = useState(`-- Join sales data with customer information
SELECT 
  s.customer_name,
  s.product,
  s.amount,
  s.date,
  c.email,
  c.tier
FROM sales_2024 s
LEFT JOIN customers c ON s.customer_name = c.name
WHERE s.amount > 1000
ORDER BY s.date DESC
LIMIT 100;`)
  const [isRunning, setIsRunning] = useState(false)
  const [queryResults, setQueryResults] = useState([])
  const [queryError, setQueryError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveOption, setSaveOption] = useState("new")
  const [newDatasetName, setNewDatasetName] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [queryHistory, setQueryHistory] = useState<any[]>([])

  const selectedDatasetsData = mockDatasets.filter((d) => selectedDatasets.includes(d.id))

  const loadHistoryQuery = (item: any) => {
    setSqlQuery(item.sql)
    setShowHistory(false)
  }

  // Sort results
  const sortedResults = React.useMemo(() => {
    if (!sortColumn || queryResults.length === 0) return queryResults

    return [...queryResults].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === bVal) return 0

      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [queryResults, sortColumn, sortDirection])

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentResults = sortedResults.slice(startIndex, endIndex)

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("sql-draft", sqlQuery)
    }, 1000)

    return () => clearTimeout(timer)
  }, [sqlQuery])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "Enter":
            e.preventDefault()
            if (!isRunning && selectedDatasets.length > 0 && sqlQuery.trim()) {
              runQuery()
            }
            break
          case "s":
            e.preventDefault()
            if (queryResults.length > 0) {
              setSaveDialogOpen(true)
            }
            break
          case "f":
            if (textareaRef.current && document.activeElement === textareaRef.current) {
              // Let browser handle find in textarea
              return
            }
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isRunning, selectedDatasets, sqlQuery, queryResults])

  const addDataset = (datasetId: string) => {
    if (!selectedDatasets.includes(datasetId)) {
      setSelectedDatasets([...selectedDatasets, datasetId])
    }
  }

  const removeDataset = (datasetId: string) => {
    setSelectedDatasets(selectedDatasets.filter((id) => id !== datasetId))
  }

  const runQuery = async () => {
    const startTime = Date.now()
    setIsRunning(true)
    setQueryError("")
    setExecutionTime(null)

    // Simulate API call
    setTimeout(() => {
      const endTime = Date.now()
      const execTime = endTime - startTime

      if (sqlQuery.toLowerCase().includes("error")) {
        setQueryError("Syntax error: Invalid SQL statement near 'error'")
        setQueryResults([])
      } else {
        setQueryResults(mockQueryResults)
        setCurrentPage(1)
        setExecutionTime(execTime)

        // Save query to history
        setQueryHistory((prev) => [
          ...prev,
          {
            id: Date.now(),
            sql: sqlQuery,
            resultCount: mockQueryResults.length,
            executionTime: execTime,
            timestamp: new Date(),
            status: "success",
          },
        ])
      }
      setIsRunning(false)
    }, 1500)
  }

  const handleSave = () => {
    // Simulate save operation
    console.log("Saving results:", { saveOption, newDatasetName })
    setSaveDialogOpen(false)
    setNewDatasetName("")
  }

  const insertTemplate = (template: { name: string; sql: string }) => {
    // Replace placeholder table names with actual selected datasets
    let templateSql = template.sql
    if (selectedDatasets.length > 0) {
      templateSql = templateSql.replace(/{table_name}/g, selectedDatasets[0])
      templateSql = templateSql.replace(/{table1}/g, selectedDatasets[0])
      if (selectedDatasets.length > 1) {
        templateSql = templateSql.replace(/{table2}/g, selectedDatasets[1])
      }
    }

    // If editor is empty, replace entirely, otherwise append
    if (
      sqlQuery.trim() === "" ||
      sqlQuery ===
        `-- Join sales data with customer information
SELECT 
      s.customer_name,
      s.product,
      s.amount,
      s.date,
      c.email,
      c.tier
    FROM sales_2024 s
    LEFT JOIN customers c ON s.customer_name = c.name
    WHERE s.amount > 1000
    ORDER BY s.date DESC
    LIMIT 100;`
    ) {
      setSqlQuery(templateSql)
    } else {
      setSqlQuery(sqlQuery + "\n\n-- " + template.name + "\n" + templateSql)
    }
    setShowTemplates(false)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const selectAllRows = () => {
    if (selectedRows.length === currentResults.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(currentResults.map((_, index) => index))
    }
  }

  const exportData = (format: "csv" | "json") => {
    const dataToExport = selectedRows.length > 0 ? selectedRows.map((index) => currentResults[index]) : sortedResults

    if (format === "csv") {
      const headers = Object.keys(dataToExport[0] || {})
      const csvContent = [
        headers.join(","),
        ...dataToExport.map((row) =>
          headers
            .map((header) =>
              typeof row[header] === "string" && row[header].includes(",") ? `"${row[header]}"` : row[header],
            )
            .join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "query-results.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const jsonContent = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "query-results.json"
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatSQL = () => {
    // Basic SQL formatting
    const formatted = sqlQuery
      .replace(/\bSELECT\b/gi, "SELECT")
      .replace(/\bFROM\b/gi, "\nFROM")
      .replace(/\bWHERE\b/gi, "\nWHERE")
      .replace(/\bJOIN\b/gi, "\nJOIN")
      .replace(/\bORDER BY\b/gi, "\nORDER BY")
      .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
      .replace(/\bLIMIT\b/gi, "\nLIMIT")

    setSqlQuery(formatted)
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Collapsible Sidebar */}
          <ResizablePanel defaultSize={28} minSize={0} maxSize={45} collapsible>
            <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
              {/* Add Dataset */}
              <div className="p-3 border-b border-sidebar-border">
                <Select onValueChange={addDataset}>
                  <SelectTrigger className="h-8 bg-card border-border text-xs">
                    <div className="flex items-center gap-2">
                      <Plus className="w-3 h-3 text-muted-foreground" />
                      <SelectValue placeholder="Add dataset" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {mockDatasets
                      .filter((dataset) => !selectedDatasets.includes(dataset.id))
                      .map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          <div className="flex items-center gap-3">
                            <Database className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{dataset.name}</div>
                              <div className="text-xs text-muted-foreground">{dataset.rows.toLocaleString()} rows</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Query History Toggle */}
              <div className="p-3 border-b border-sidebar-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full h-8 text-xs justify-start"
                >
                  <History className="w-3 h-3 mr-2" />
                  Query History ({queryHistory.length})
                </Button>
              </div>

              {/* Query History Panel */}
              {showHistory && (
                <div className="border-b border-sidebar-border">
                  <ScrollArea className="h-48">
                    <div className="p-3 space-y-2">
                      {queryHistory.length > 0 ? (
                        queryHistory.map((item) => (
                          <Card
                            key={item.id}
                            className="border-border bg-card cursor-pointer hover:bg-sidebar-accent transition-colors"
                            onClick={() => loadHistoryQuery(item)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <Badge
                                  variant={item.status === "success" ? "default" : "destructive"}
                                  className="text-xs h-4"
                                >
                                  {item.status === "success" ? `${item.resultCount} rows` : "Error"}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {item.executionTime}ms
                                </div>
                              </div>
                              <div className="text-xs font-mono text-muted-foreground line-clamp-2 mb-1">
                                {item.sql
                                  .split("\n")
                                  .slice(0, 2)
                                  .join(" ")
                                  .replace(/^--\s*/, "")
                                  .trim()}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center justify-between">
                                <span>{item.timestamp.toLocaleTimeString()}</span>
                                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                  Click to load
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center text-xs text-muted-foreground py-4">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No query history yet</p>
                          <p className="text-muted-foreground/60">Run queries to see history</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Active Datasets */}
              <ScrollArea className="flex-1">
                {selectedDatasetsData.length > 0 ? (
                  <div className="p-3 space-y-2">
                    {selectedDatasetsData.map((dataset) => (
                      <Card
                        key={dataset.id}
                        className="border-border bg-card"
                      >
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center border border-border">
                                <Database className="w-3 h-3 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-xs font-medium text-card-foreground truncate">
                                  {dataset.name}
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                  {dataset.id}
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDataset(dataset.id)}
                              className="h-5 w-5 p-0 hover:bg-destructive/10"
                            >
                              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3 space-y-2">
                          {/* Compact Stats */}
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <RowsIcon className="w-3 h-3" />
                              <span>{dataset.rows.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Columns className="w-3 h-3" />
                              <span>{dataset.columns}</span>
                            </div>
                          </div>

                          {/* Compact Schema */}
                          <ScrollArea className="h-24">
                            <div className="space-y-1">
                              {dataset.schema.slice(0, 6).map((column, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="text-muted-foreground/60">{getTypeIcon(column.type)}</div>
                                    <span className="font-mono text-foreground truncate text-xs">
                                      {column.name}
                                    </span>
                                    {!column.nullable && (
                                      <div className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              ))}
                              {dataset.schema.length > 6 && (
                                <div className="text-xs text-muted-foreground text-center py-1">
                                  +{dataset.schema.length - 6} more
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center mx-auto mb-2">
                        <Database className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-foreground font-medium">No datasets</p>
                      <p className="text-xs text-muted-foreground">Add datasets to start</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="w-1 bg-border hover:bg-border/80 transition-colors"
          >
            <div className="flex h-full items-center justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </ResizableHandle>

          {/* Main Content */}
          <ResizablePanel defaultSize={72} minSize={50}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* SQL Editor */}
              <ResizablePanel defaultSize={40} minSize={25} maxSize={65}>
                <div
                  className={`h-full bg-background border-b border-border flex flex-col ${isFullScreen ? "fixed inset-0 z-50 bg-background" : ""}`}
                >
                  {/* Clean Action Bar */}
                  <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-card">
                    {/* Left Side - Tools */}
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs border-border bg-card"
                          >
                            <Code className="w-3 h-3 mr-1.5" />
                            Format
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={formatSQL}>
                            <Settings className="w-3 h-3 mr-2" />
                            Format SQL
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="w-3 h-3 mr-2" />
                            Validate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu open={showTemplates} onOpenChange={setShowTemplates}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs border-border bg-card"
                          >
                            <Database className="w-3 h-3 mr-1.5" />
                            Templates
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
                          {Object.entries(sqlTemplates).map(([category, templates]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">
                                {category}
                              </div>
                              {templates.map((template, index) => (
                                <DropdownMenuItem
                                  key={`${category}-${index}`}
                                  onClick={() => insertTemplate(template)}
                                  className="flex flex-col items-start p-3 cursor-pointer"
                                >
                                  <div className="font-medium text-sm">{template.name}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {template.description}
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(sqlQuery)}
                            className="h-7 px-2 text-xs border-border bg-card"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy SQL</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="h-7 px-2 text-xs border-border bg-card"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Full Screen</TooltipContent>
                      </Tooltip>

                      {selectedDatasets.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs h-6 bg-primary/10 text-primary border border-primary/20"
                        >
                          <Database className="w-3 h-3 mr-1" />
                          {selectedDatasets.length} tables
                        </Badge>
                      )}
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex items-center gap-2">
                      {executionTime && (
                        <Badge variant="outline" className="text-xs h-6">
                          <Clock className="w-3 h-3 mr-1" />
                          {executionTime}ms
                        </Badge>
                      )}

                      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={queryResults.length === 0}
                            className="h-7 px-3 text-xs border-border bg-card"
                          >
                            <Save className="w-3 h-3 mr-1.5" />
                            Save
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Save Query Results</DialogTitle>
                            <DialogDescription>Choose how you want to save the query results.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <RadioGroup value={saveOption} onValueChange={setSaveOption}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="new" />
                                <Label htmlFor="new">Save as new dataset</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="overwrite" id="overwrite" />
                                <Label htmlFor="overwrite">Overwrite existing dataset</Label>
                              </div>
                            </RadioGroup>
                            {saveOption === "new" && (
                              <div className="space-y-2">
                                <Label htmlFor="dataset-name">Dataset Name</Label>
                                <Input
                                  id="dataset-name"
                                  value={newDatasetName}
                                  onChange={(e) => setNewDatasetName(e.target.value)}
                                  placeholder="Enter dataset name"
                                />
                              </div>
                            )}
                            {saveOption === "overwrite" && (
                              <div className="space-y-2">
                                <Label htmlFor="existing-dataset">Select Dataset</Label>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose dataset to overwrite" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {mockDatasets.map((dataset) => (
                                      <SelectItem key={dataset.id} value={dataset.id}>
                                        {dataset.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saveOption === "new" && !newDatasetName.trim()}>
                              Save Dataset
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={runQuery}
                        disabled={selectedDatasets.length === 0 || !sqlQuery.trim() || isRunning}
                        className="h-7 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                            Running
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1.5" />
                            Run Query
                          </>
                        )}
                      </Button>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-border bg-card"
                          >
                            <Command className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div>⌘+Enter: Run Query</div>
                            <div>⌘+S: Save Results</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {isFullScreen && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsFullScreen(false)}
                          className="h-7 px-2 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* SQL Editor with Line Numbers */}
                  <div className="flex-1 flex">
                    {showLineNumbers && (
                      <div className="w-12 bg-muted/30 border-r border-border p-2 text-xs text-muted-foreground font-mono">
                        {sqlQuery.split("\n").map((_, index) => (
                          <div key={index} className="text-right leading-5">
                            {index + 1}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex-1 p-2">
                      <Textarea
                        ref={textareaRef}
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        placeholder="Write your SQL query here..."
                        className="h-full font-mono text-sm resize-none bg-card border-border focus:border-primary"
                      />
                      {queryError && (
                        <Alert
                          className="mt-2 border-destructive/20 bg-destructive/10"
                          variant="destructive"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{queryError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              {!isFullScreen && (
                <>
                  <ResizableHandle
                    withHandle
                    className="h-1 bg-border hover:bg-border/80 transition-colors"
                  >
                    <div className="flex w-full items-center justify-center">
                      <GripVertical className="h-4 w-4 text-muted-foreground rotate-90" />
                    </div>
                  </ResizableHandle>

                  {/* Results Panel */}
                  <ResizablePanel defaultSize={60} minSize={35}>
                    <div className="h-full flex flex-col bg-background relative">
                      {/* Results Header */}
                      {queryResults.length > 0 && (
                        <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-card">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 bg-sidebar-accent text-sidebar-accent-foreground border-0"
                            >
                              <TableIcon className="w-3 h-3 mr-1" />
                              {queryResults.length} rows
                            </Badge>
                            {selectedRows.length > 0 && (
                              <Badge variant="outline" className="text-xs h-5">
                                {selectedRows.length} selected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                                  <Download className="w-3 h-3 mr-1" />
                                  Export
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => exportData("csv")}>
                                  <FileText className="w-3 h-3 mr-2" />
                                  Export CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportData("json")}>
                                  <Code className="w-3 h-3 mr-2" />
                                  Export JSON
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-auto">
                        {isRunning ? (
                          <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center mx-auto mb-2 border border-border">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              </div>
                              <p className="text-xs text-foreground font-medium">Executing...</p>
                            </div>
                          </div>
                        ) : queryResults.length > 0 ? (
                          <>
                            <div className="bg-card">
                              <Table>
                                <TableHeader className="sticky top-0 bg-muted/50">
                                  <TableRow className="border-border">
                                    <TableHead className="w-8">
                                      <Checkbox
                                        checked={
                                          selectedRows.length === currentResults.length && currentResults.length > 0
                                        }
                                        onCheckedChange={selectAllRows}
                                      />
                                    </TableHead>
                                    {Object.keys(queryResults[0]).map((column) => (
                                      <TableHead
                                        key={column}
                                        className="font-medium text-foreground text-xs h-8 cursor-pointer hover:bg-muted/30"
                                        onClick={() => handleSort(column)}
                                      >
                                        <div className="flex items-center gap-1">
                                          {column}
                                          {sortColumn === column &&
                                            (sortDirection === "asc" ? (
                                              <ArrowUp className="w-3 h-3" />
                                            ) : (
                                              <ArrowDown className="w-3 h-3" />
                                            ))}
                                          {sortColumn !== column && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                        </div>
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {currentResults.map((row, index) => (
                                    <TableRow
                                      key={index}
                                      className={`border-border hover:bg-muted/30 ${
                                        selectedRows.includes(index) ? "bg-accent/50" : ""
                                      }`}
                                    >
                                      <TableCell className="w-8">
                                        <Checkbox
                                          checked={selectedRows.includes(index)}
                                          onCheckedChange={() => toggleRowSelection(index)}
                                        />
                                      </TableCell>
                                      {Object.values(row).map((value, cellIndex) => (
                                        <TableCell
                                          key={cellIndex}
                                          className="font-mono text-xs text-muted-foreground py-2"
                                        >
                                          {typeof value === "number" ? value.toLocaleString() : String(value)}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Compact Pagination */}
                            {totalPages > 1 && (
                              <div className="sticky bottom-0 bg-background/90 backdrop-blur-sm border-t border-border px-2 py-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">{startIndex + 1}</span>-
                                    <span className="font-medium">{Math.min(endIndex, sortedResults.length)}</span> of{" "}
                                    <span className="font-medium">{sortedResults.length}</span>
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                      disabled={currentPage === 1}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <ChevronLeft className="w-3 h-3" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground px-2">
                                      {currentPage}/{totalPages}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                      disabled={currentPage === totalPages}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center mx-auto mb-2">
                                <Database className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <p className="text-xs text-foreground font-medium">
                                {selectedDatasets.length > 0 ? "Ready to execute" : "Select datasets first"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedDatasets.length > 0 ? "Click Run to see results" : "Add datasets to start"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Status Bar */}
        {isRunning && (
          <div className="fixed bottom-0 left-0 right-0 bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-2 text-xs flex items-center gap-2">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Executing query...</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}