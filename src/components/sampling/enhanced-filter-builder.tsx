import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  X,
  Filter,
  Sparkles,
  ChevronRight,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  Clock,
  Search,
  Zap,
  Save,
  FolderOpen,
  Trash2,
  ChevronDown,
  Parentheses,
  Database,
  HelpCircle
} from "lucide-react"
import type { 
  DataFilters,
  SamplingCondition
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

// UI-friendly operator type
type UIOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not contains' | 'starts with' | 'ends with'

// Internal condition type with UI operators
interface UICondition {
  column: string
  operator: UIOperator
  value: string
}

interface EnhancedFilterBuilderProps {
  columns: string[]
  columnTypes?: Record<string, string>
  sampleValues?: Record<string, unknown[]>
  filters?: DataFilters
  onFiltersChange: (filters: DataFilters | undefined) => void
}

const operators: Record<string, { operators: UIOperator[], icon: typeof Type }> = {
  string: { 
    operators: ['=', '!=', 'contains', 'not contains', 'starts with', 'ends with'],
    icon: Type
  },
  number: { 
    operators: ['=', '!=', '>', '<', '>=', '<='],
    icon: Hash
  },
  boolean: { 
    operators: ['=', '!='],
    icon: ToggleLeft
  },
  date: { 
    operators: ['=', '!=', '>', '<', '>=', '<='],
    icon: Calendar
  },
  default: { 
    operators: ['=', '!='],
    icon: Database
  }
}

const operatorInfo: Record<UIOperator, { label: string, description: string, examples?: string[] }> = {
  '=': { 
    label: 'equals', 
    description: 'Exact match',
    examples: ['John', '100', 'true']
  },
  '!=': { 
    label: 'not equals', 
    description: 'Does not match',
    examples: ['John', '100', 'false']
  },
  '>': { 
    label: 'greater than', 
    description: 'Value is larger',
    examples: ['100', '2023-01-01']
  },
  '<': { 
    label: 'less than', 
    description: 'Value is smaller',
    examples: ['100', '2023-12-31']
  },
  '>=': { 
    label: 'greater or equal', 
    description: 'Value is larger or same',
    examples: ['100', '2023-01-01']
  },
  '<=': { 
    label: 'less or equal', 
    description: 'Value is smaller or same',
    examples: ['100', '2023-12-31']
  },
  'contains': { 
    label: 'contains', 
    description: 'Text includes value',
    examples: ['John', 'test', '@gmail']
  },
  'not contains': { 
    label: 'not contains', 
    description: 'Text excludes value',
    examples: ['spam', 'test', 'draft']
  },
  'starts with': { 
    label: 'starts with', 
    description: 'Text begins with value',
    examples: ['Mr.', 'Dr.', 'https://']
  },
  'ends with': { 
    label: 'ends with', 
    description: 'Text ends with value',
    examples: ['.com', '.pdf', '_draft']
  }
}

const quickFilterTemplates = [
  {
    id: 'recent',
    name: 'Recent Data',
    icon: Clock,
    description: 'Last 30 days',
    filters: (dateColumn: string) => ({
      conditions: [{
        column: dateColumn,
        operator: '>=' as const,
        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }],
      logic: 'AND' as const
    })
  },
  {
    id: 'high-value',
    name: 'High Value',
    icon: Zap,
    description: 'Above average',
    filters: (valueColumn: string) => ({
      conditions: [{
        column: valueColumn,
        operator: '>' as const,
        value: '1000' // This would be dynamic in real implementation
      }],
      logic: 'AND' as const
    })
  }
]

export function EnhancedFilterBuilder({
  columns,
  columnTypes = {},
  sampleValues = {},
  filters,
  onFiltersChange
}: EnhancedFilterBuilderProps) {
  // Convert from API conditions to UI conditions
  const convertToUIConditions = (apiConditions: SamplingCondition[]): UICondition[] => {
    return apiConditions.map(cond => ({
      column: cond.column,
      operator: (
        cond.operator === 'LIKE' && String(cond.value).startsWith('%') && String(cond.value).endsWith('%') ? 'contains' :
        (cond.operator as string) === 'NOT LIKE' ? 'not contains' :
        cond.operator === 'LIKE' && String(cond.value).endsWith('%') ? 'starts with' :
        cond.operator === 'LIKE' && String(cond.value).startsWith('%') ? 'ends with' :
        cond.operator as UIOperator
      ),
      value: (
        (cond.operator === 'LIKE' || (cond.operator as string) === 'NOT LIKE') 
          ? String(cond.value).replace(/%/g, '') 
          : String(cond.value)
      )
    }))
  }

  // Convert from UI conditions to API conditions
  const convertToAPIConditions = (uiConditions: UICondition[]): SamplingCondition[] => {
    return uiConditions.map(cond => ({
      column: cond.column,
      operator: (
        cond.operator === 'contains' ? 'LIKE' :
        cond.operator === 'not contains' ? 'LIKE' :
        cond.operator === 'starts with' ? 'LIKE' :
        cond.operator === 'ends with' ? 'LIKE' :
        cond.operator
      ) as SamplingCondition['operator'],
      value: (
        cond.operator === 'contains' || cond.operator === 'not contains' ? `%${cond.value}%` :
        cond.operator === 'starts with' ? `${cond.value}%` :
        cond.operator === 'ends with' ? `%${cond.value}` :
        cond.value
      )
    }))
  }

  const [conditions, setConditions] = useState<UICondition[]>(
    filters?.conditions ? convertToUIConditions(filters.conditions) : []
  )
  const [useOrLogic, setUseOrLogic] = useState(filters?.logic === ('OR' as const))
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple')
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string, filters: DataFilters }>>([])
  const [filterName, setFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  useEffect(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem('savedFilters')
    if (saved) {
      setSavedFilters(JSON.parse(saved))
    }
  }, [])

  const updateFilters = (newConditions: UICondition[], orLogic: boolean = useOrLogic) => {
    if (newConditions.length === 0) {
      onFiltersChange(undefined)
    } else {
      const apiConditions = convertToAPIConditions(newConditions)
      onFiltersChange({
        conditions: apiConditions,
        logic: orLogic ? 'OR' : 'AND'
      })
    }
  }

  const addCondition = () => {
    const newCondition: UICondition = {
      column: columns[0] || '',
      operator: '=',
      value: ''
    }
    const newConditions = [...conditions, newCondition]
    setConditions(newConditions)
    updateFilters(newConditions)
  }

  const updateCondition = (index: number, updates: Partial<UICondition>) => {
    const newConditions = conditions.map((cond, i) => 
      i === index ? { ...cond, ...updates } : cond
    )
    setConditions(newConditions)
    updateFilters(newConditions)
  }

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    setConditions(newConditions)
    updateFilters(newConditions)
  }

  const getColumnIcon = (column: string) => {
    const type = columnTypes[column] || 'string'
    const config = operators[type] || operators.default
    return config.icon
  }

  const getSuggestedValues = (column: string): string[] => {
    const samples = sampleValues[column] || []
    // Return unique values, limited to 10
    return [...new Set(samples)].slice(0, 10).map(String)
  }

  const applyQuickFilter = (template: typeof quickFilterTemplates[0], column: string) => {
    const filterData = template.filters(column)
    const uiConditions = convertToUIConditions(filterData.conditions)
    setConditions(uiConditions)
    setUseOrLogic(filterData.logic === ('OR' as const))
    updateFilters(uiConditions, filterData.logic === ('OR' as const))
  }

  const saveCurrentFilters = () => {
    if (!filterName.trim() || conditions.length === 0) return
    
    const newSaved = [...savedFilters, {
      name: filterName,
      filters: {
        conditions: convertToAPIConditions(conditions),
        logic: useOrLogic ? 'OR' : 'AND'
      } as DataFilters
    }]
    
    setSavedFilters(newSaved)
    localStorage.setItem('savedFilters', JSON.stringify(newSaved))
    setFilterName('')
    setShowSaveDialog(false)
  }

  const loadSavedFilter = (saved: { name: string, filters: DataFilters }) => {
    const uiConditions = saved.filters.conditions ? convertToUIConditions(saved.filters.conditions) : []
    setConditions(uiConditions)
    setUseOrLogic(saved.filters.logic === ('OR' as const))
    updateFilters(uiConditions, saved.filters.logic === ('OR' as const))
  }

  const deleteSavedFilter = (index: number) => {
    const newSaved = savedFilters.filter((_, i) => i !== index)
    setSavedFilters(newSaved)
    localStorage.setItem('savedFilters', JSON.stringify(newSaved))
  }

  const FilterCondition = ({ condition, index }: { condition: UICondition, index: number }) => {
    const columnType = columnTypes[condition.column] || 'string'
    const availableOps = operators[columnType] || operators.default
    const ColumnIcon = getColumnIcon(condition.column)
    const suggestedValues = getSuggestedValues(condition.column)
    const [showValueSuggestions, setShowValueSuggestions] = useState(false)

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="group"
      >
        {index > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-border" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Badge 
                variant={useOrLogic ? "secondary" : "default"} 
                className="text-xs px-3 py-1"
              >
                {useOrLogic ? 'OR' : 'AND'}
              </Badge>
            </motion.div>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
        
        <Card className="border-muted hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                {/* Column Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Column</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ColumnIcon className="h-4 w-4 text-muted-foreground" />
                          {condition.column || 'Select column'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search columns..." />
                        <CommandEmpty>No column found.</CommandEmpty>
                        <CommandGroup>
                          {columns.map(col => {
                            const Icon = operators[columnTypes[col] || 'string']?.icon || Database
                            return (
                              <CommandItem
                                key={col}
                                onSelect={() => updateCondition(index, { column: col })}
                              >
                                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="flex-1">{col}</span>
                                {columnTypes[col] && (
                                  <Badge variant="outline" className="text-[10px] ml-2">
                                    {columnTypes[col]}
                                  </Badge>
                                )}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Operator Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Condition</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value as UIOperator })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOps.operators.map(op => {
                        const info = operatorInfo[op]
                        return (
                          <SelectItem key={op} value={op}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{info.label}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 ml-2 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{info.description}</p>
                                  {info.examples && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      e.g. {info.examples.join(', ')}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Input */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <div className="relative">
                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      onFocus={() => setShowValueSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowValueSuggestions(false), 200)}
                      placeholder={`Enter ${columnTypes[condition.column] || 'value'}`}
                      className="pr-8"
                    />
                    {suggestedValues.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-8"
                        onClick={() => setShowValueSuggestions(!showValueSuggestions)}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {/* Value Suggestions */}
                    <AnimatePresence>
                      {showValueSuggestions && suggestedValues.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg"
                        >
                          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                            <p className="text-xs text-muted-foreground px-2 py-1">Suggestions:</p>
                            {suggestedValues.map((val, i) => (
                              <Button
                                key={i}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={() => {
                                  updateCondition(index, { value: val })
                                  setShowValueSuggestions(false)
                                }}
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                className="mt-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeCondition(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'simple' | 'advanced')}>
        <TabsList className="grid grid-cols-2 w-full max-w-[400px]">
          <TabsTrigger value="simple" className="gap-2">
            <Filter className="h-4 w-4" />
            Simple Filters
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Parentheses className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simple" className="space-y-4">
          {conditions.length > 0 ? (
            <>
              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Filter className="h-3 w-3" />
                    {conditions.length} filter{conditions.length > 1 ? 's' : ''}
                  </Badge>
                  {conditions.length > 1 && (
                    <Badge variant={useOrLogic ? "secondary" : "default"}>
                      Match {useOrLogic ? 'ANY' : 'ALL'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Save Filter Set</h4>
                        <Input
                          placeholder="Filter name"
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                        />
                        <Button 
                          onClick={saveCurrentFilters} 
                          className="w-full"
                          disabled={!filterName.trim()}
                        >
                          Save Filters
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConditions([])
                      updateFilters([])
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {conditions.map((condition, index) => (
                    <FilterCondition
                      key={index}
                      condition={condition}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Logic toggle - only show if more than one condition */}
              {conditions.length > 1 && (
                <Card className="bg-muted/30">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="filter-logic" className="text-sm font-normal">
                        Match {useOrLogic ? 'any' : 'all'} of the conditions above
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        !useOrLogic && "text-primary"
                      )}>
                        ALL (AND)
                      </span>
                      <Switch
                        id="filter-logic"
                        checked={useOrLogic}
                        onCheckedChange={(checked: boolean) => {
                          setUseOrLogic(checked)
                          updateFilters(conditions, checked)
                        }}
                      />
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        useOrLogic && "text-primary"
                      )}>
                        ANY (OR)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Filter Button */}
              <Button
                onClick={addCondition}
                variant="outline"
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Filter
              </Button>
            </>
          ) : (
            /* Empty state with quick filters */
            <div className="space-y-4">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Filter className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">No filters applied</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add filters to refine your data selection
                  </p>
                  <Button
                    onClick={addCondition}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Your First Filter
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Filter Templates */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Filters
                </h4>
                <div className="grid gap-2">
                  {quickFilterTemplates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <template.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{template.name}</p>
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            </div>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Apply
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">Select column</h4>
                                <Select
                                  onValueChange={(col) => applyQuickFilter(template, col)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {columns.map(col => (
                                      <SelectItem key={col} value={col}>
                                        {col}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Saved Filters
                  </h4>
                  <div className="grid gap-2">
                    {savedFilters.map((saved, index) => (
                      <Card key={index} className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                                <Save className="h-4 w-4 text-secondary-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{saved.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {saved.filters.conditions?.length || 0} conditions
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadSavedFilter(saved)}
                              >
                                Load
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteSavedFilter(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Advanced Filter Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced filtering with nested groups coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}