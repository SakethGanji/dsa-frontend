import { useState, useEffect, useMemo } from "react"
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Search, 
  CheckSquare, 
  Square, 
  Database, 
  Hash, 
  Type, 
  Calendar, 
  Binary, 
  ChevronDown, 
  AlertCircle,
  SortAsc,
  SortDesc
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ColumnSelectorProps {
  columns: string[]
  columnTypes?: Record<string, string>
  nullCounts?: Record<string, number>
  sampleValues?: Record<string, any[]>
  totalRows?: number
  selectedColumns: string[]
  onColumnsChange: (columns: string[]) => void
  orderBy?: string | null
  orderDesc?: boolean
  onOrderChange?: (column: string | null, desc: boolean) => void
}

const getColumnIcon = (type: string) => {
  const upperType = type?.toUpperCase() || ''
  if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
    return <Hash className="w-3 h-3" />
  }
  if (upperType.includes('VARCHAR') || upperType.includes('TEXT') || upperType.includes('CHAR')) {
    return <Type className="w-3 h-3" />
  }
  if (upperType.includes('DATE') || upperType.includes('TIME')) {
    return <Calendar className="w-3 h-3" />
  }
  if (upperType.includes('BOOL')) {
    return <Binary className="w-3 h-3" />
  }
  return <Database className="w-3 h-3" />
}

const getTypeColor = (type: string) => {
  const upperType = type?.toUpperCase() || ''
  if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
    return "text-blue-600 dark:text-blue-400"
  }
  if (upperType.includes('VARCHAR') || upperType.includes('TEXT') || upperType.includes('CHAR')) {
    return "text-green-600 dark:text-green-400"
  }
  if (upperType.includes('DATE') || upperType.includes('TIME')) {
    return "text-purple-600 dark:text-purple-400"
  }
  if (upperType.includes('BOOL')) {
    return "text-orange-600 dark:text-orange-400"
  }
  return "text-gray-600 dark:text-gray-400"
}

export function ColumnSelector({ 
  columns, 
  columnTypes = {},
  nullCounts = {},
  sampleValues = {},
  totalRows = 0,
  selectedColumns, 
  onColumnsChange,
  orderBy,
  orderDesc = false,
  onOrderChange
}: ColumnSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selectedColumns))
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'byType' | 'byNull'>('all')
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLocalSelected(new Set(selectedColumns.length > 0 ? selectedColumns : columns))
  }, [columns, selectedColumns])

  // Group columns by type
  const columnsByType = useMemo(() => {
    const groups: Record<string, string[]> = {}
    columns.forEach(col => {
      const type = columnTypes[col]?.toUpperCase() || 'UNKNOWN'
      let group = 'Other'
      if (type.includes('INT') || type.includes('DECIMAL') || type.includes('FLOAT') || type.includes('DOUBLE') || type.includes('BIGINT')) {
        group = 'Numeric'
      } else if (type.includes('VARCHAR') || type.includes('TEXT') || type.includes('CHAR')) {
        group = 'Text'
      } else if (type.includes('DATE') || type.includes('TIME')) {
        group = 'Date/Time'
      } else if (type.includes('BOOL')) {
        group = 'Boolean'
      }
      if (!groups[group]) groups[group] = []
      groups[group].push(col)
    })
    return groups
  }, [columns, columnTypes])

  // Group columns by null percentage
  const columnsByNullPercentage = useMemo(() => {
    if (!totalRows) return {}
    const groups: Record<string, string[]> = {
      'No nulls': [],
      'Low nulls (< 10%)': [],
      'Medium nulls (10-50%)': [],
      'High nulls (> 50%)': []
    }
    columns.forEach(col => {
      const nullCount = nullCounts[col] || 0
      const nullPercentage = (nullCount / totalRows) * 100
      if (nullPercentage === 0) {
        groups['No nulls'].push(col)
      } else if (nullPercentage < 10) {
        groups['Low nulls (< 10%)'].push(col)
      } else if (nullPercentage <= 50) {
        groups['Medium nulls (10-50%)'].push(col)
      } else {
        groups['High nulls (> 50%)'].push(col)
      }
    })
    return groups
  }, [columns, nullCounts, totalRows])

  const filteredColumns = columns.filter(col => {
    const matchesSearch = col.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (columnTypes[col] || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !showOnlySelected || localSelected.has(col)
    return matchesSearch && matchesFilter
  })

  const handleToggleColumn = (columnName: string) => {
    const newSelected = new Set(localSelected)
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName)
    } else {
      newSelected.add(columnName)
    }
    setLocalSelected(newSelected)
    onColumnsChange(Array.from(newSelected))
  }

  const handleSelectAll = () => {
    const allColumnNames = new Set(columns)
    setLocalSelected(allColumnNames)
    onColumnsChange(Array.from(allColumnNames))
  }

  const handleDeselectAll = () => {
    setLocalSelected(new Set())
    onColumnsChange([])
  }

  const selectedCount = localSelected.size
  
  const toggleTypeGroup = (type: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedTypes(newExpanded)
  }

  const toggleColumnExpanded = (column: string) => {
    const newExpanded = new Set(expandedColumns)
    if (newExpanded.has(column)) {
      newExpanded.delete(column)
    } else {
      newExpanded.add(column)
    }
    setExpandedColumns(newExpanded)
  }

  const selectGroup = (columnNames: string[]) => {
    const newSelected = new Set(localSelected)
    columnNames.forEach(name => newSelected.add(name))
    setLocalSelected(newSelected)
    onColumnsChange(Array.from(newSelected))
  }

  const deselectGroup = (columnNames: string[]) => {
    const newSelected = new Set(localSelected)
    columnNames.forEach(name => newSelected.delete(name))
    setLocalSelected(newSelected)
    onColumnsChange(Array.from(newSelected))
  }

  const renderColumnItem = (column: string, showDetails = false) => {
    const type = columnTypes[column] || 'UNKNOWN'
    const nullCount = nullCounts[column] || 0
    const nullPercentage = totalRows > 0 ? ((nullCount / totalRows) * 100).toFixed(1) : '0'
    const samples = sampleValues[column] || []
    const isOrderColumn = orderBy === column
    const isExpanded = expandedColumns.has(column)

    return (
      <div
        key={column}
        className={cn(
          "rounded-md transition-colors",
          localSelected.has(column) && "bg-blue-50/50 dark:bg-blue-950/20"
        )}
      >
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
          <div className="flex items-center space-x-3 flex-1">
            <Checkbox
              id={column}
              checked={localSelected.has(column)}
              onCheckedChange={() => handleToggleColumn(column)}
            />
            <Label
              htmlFor={column}
              className="flex-1 cursor-pointer text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                {showDetails && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggleColumnExpanded(column)
                    }}
                    className="hover:text-primary"
                  >
                    <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "transform rotate-180")} />
                  </button>
                )}
                <span className={getTypeColor(type)}>
                  {getColumnIcon(type)}
                </span>
                <span>{column}</span>
              </div>
            </Label>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px] py-0 h-5">
              {type}
            </Badge>
            {parseFloat(nullPercentage) > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] py-0 h-5",
                  parseFloat(nullPercentage) > 50 && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                )}
              >
                {nullPercentage}% null
              </Badge>
            )}
            {onOrderChange && (
              <div className="flex items-center gap-0.5">
                <Button
                  variant={isOrderColumn && !orderDesc ? "default" : "ghost"}
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOrderChange(column, false)
                  }}
                >
                  <SortAsc className="h-3 w-3" />
                </Button>
                <Button
                  variant={isOrderColumn && orderDesc ? "default" : "ghost"}
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOrderChange(column, true)
                  }}
                >
                  <SortDesc className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {showDetails && isExpanded && samples.length > 0 && (
          <div className="px-4 pb-2 ml-8 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Sample values:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {samples.slice(0, 5).map((value, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {String(value)}
                  </Badge>
                ))}
                {samples.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{samples.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Column Selection</CardTitle>
            <CardDescription className="text-xs">
              Choose columns to include in your sample
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {selectedCount} / {columns.length} selected
            </Badge>
            {onOrderChange && orderBy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOrderChange(null, false)}
                className="text-xs h-6"
              >
                Clear Order
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
            className={cn("h-9", showOnlySelected && "bg-blue-50 dark:bg-blue-950")}
          >
            {showOnlySelected ? "Show All" : "Show Selected"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs h-7"
          >
            <CheckSquare className="w-3 h-3 mr-1" />
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="text-xs h-7"
          >
            <Square className="w-3 h-3 mr-1" />
            Deselect All
          </Button>
        </div>

        <Separator />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'byType' | 'byNull')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Columns</TabsTrigger>
            <TabsTrigger value="byType">By Type</TabsTrigger>
            <TabsTrigger value="byNull">By Null %</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {filteredColumns.map(col => renderColumnItem(col, true))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="byType" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {Object.entries(columnsByType).map(([type, cols]) => {
                  const filteredTypeCols = cols.filter(col => 
                    col.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (columnTypes[col] || '').toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  if (filteredTypeCols.length === 0) return null
                  
                  const selectedInGroup = filteredTypeCols.filter(c => localSelected.has(c)).length
                  const isExpanded = expandedTypes.has(type)
                  
                  return (
                    <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleTypeGroup(type)}>
                      <div className="rounded-lg border p-2">
                        <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "transform rotate-180")} />
                            <span className="font-medium text-sm">{type}</span>
                            <Badge variant="secondary" className="text-xs">
                              {selectedInGroup} / {filteredTypeCols.length}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                selectGroup(filteredTypeCols)
                              }}
                            >
                              Select All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                deselectGroup(filteredTypeCols)
                              }}
                            >
                              Deselect All
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-1">
                          {filteredTypeCols.map(col => renderColumnItem(col))}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="byNull" className="mt-4">
            {totalRows ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {Object.entries(columnsByNullPercentage).map(([group, cols]) => {
                    const filteredNullCols = cols.filter(col => 
                      col.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (columnTypes[col] || '').toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    if (filteredNullCols.length === 0) return null
                    
                    const selectedInGroup = filteredNullCols.filter(c => localSelected.has(c)).length
                    const isExpanded = expandedTypes.has(group)
                    
                    return (
                      <Collapsible key={group} open={isExpanded} onOpenChange={() => toggleTypeGroup(group)}>
                        <div className="rounded-lg border p-2">
                          <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "transform rotate-180")} />
                              <span className="font-medium text-sm">{group}</span>
                              <Badge variant="secondary" className="text-xs">
                                {selectedInGroup} / {filteredNullCols.length}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  selectGroup(filteredNullCols)
                                }}
                              >
                                Select All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deselectGroup(filteredNullCols)
                                }}
                              >
                                Deselect All
                              </Button>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-1">
                            {filteredNullCols.map(col => renderColumnItem(col))}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Null percentage information not available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedCount === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>At least one column must be selected</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}