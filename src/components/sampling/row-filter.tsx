import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextFilterInput, type Column } from "@/components/ui/text-filter-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Trash2, 
  Filter,
  Hash,
  Type,
  Calendar,
  Binary,
  Database,
  Code2,
  Sliders
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SamplingCondition, SamplingFilters } from "@/lib/api/types"

interface RowFilterProps {
  columns: string[]
  columnTypes?: Record<string, string>
  sampleValues?: Record<string, any[]>
  filters?: SamplingFilters
  onFiltersChange: (filters: SamplingFilters | undefined) => void
}

const operators = {
  text: ['=', '!=', 'LIKE', 'ILIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'],
  numeric: ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'],
  date: ['=', '!=', '>', '<', '>=', '<=', 'IS NULL', 'IS NOT NULL'],
  boolean: ['=', '!=', 'IS NULL', 'IS NOT NULL'],
  default: ['=', '!=', 'IS NULL', 'IS NOT NULL']
}

const getOperatorsForType = (type: string) => {
  const upperType = type?.toUpperCase() || ''
  if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
    return operators.numeric
  }
  if (upperType.includes('VARCHAR') || upperType.includes('TEXT') || upperType.includes('CHAR')) {
    return operators.text
  }
  if (upperType.includes('DATE') || upperType.includes('TIME')) {
    return operators.date
  }
  if (upperType.includes('BOOL')) {
    return operators.boolean
  }
  return operators.default
}

const getColumnIcon = (type: string) => {
  const upperType = type?.toUpperCase() || ''
  if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
    return Hash
  }
  if (upperType.includes('VARCHAR') || upperType.includes('TEXT') || upperType.includes('CHAR')) {
    return Type
  }
  if (upperType.includes('DATE') || upperType.includes('TIME')) {
    return Calendar
  }
  if (upperType.includes('BOOL')) {
    return Binary
  }
  return Database
}

const getPlaceholder = (_column: string, operator: string, type?: string) => {
  if (operator === 'IS NULL' || operator === 'IS NOT NULL') return ''
  
  if (operator === 'IN' || operator === 'NOT IN') {
    return 'value1, value2, value3'
  }
  
  if (operator === 'LIKE' || operator === 'ILIKE') {
    return '%pattern%'
  }
  
  const upperType = type?.toUpperCase() || ''
  if (upperType.includes('DATE')) {
    return 'YYYY-MM-DD'
  }
  if (upperType.includes('TIME')) {
    return 'HH:MM:SS'
  }
  if (upperType.includes('BOOL')) {
    return 'true or false'
  }
  
  return 'Enter value'
}

export function RowFilter({
  columns,
  columnTypes = {},
  sampleValues = {},
  filters,
  onFiltersChange
}: RowFilterProps) {
  const [conditions, setConditions] = useState<SamplingCondition[]>(filters?.conditions || [])
  const [logic, setLogic] = useState<'AND' | 'OR'>(filters?.logic || 'AND')
  const [isEnabled, setIsEnabled] = useState(!!filters)
  const [filterMode, setFilterMode] = useState<'simple' | 'advanced'>('simple')
  const [advancedExpression, setAdvancedExpression] = useState('')

  const addCondition = () => {
    const newCondition: SamplingCondition = {
      column: columns[0],
      operator: '=',
      value: ''
    }
    const newConditions = [...conditions, newCondition]
    setConditions(newConditions)
    updateFilters(newConditions, logic)
  }

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    setConditions(newConditions)
    if (newConditions.length === 0) {
      setIsEnabled(false)
      onFiltersChange(undefined)
    } else {
      updateFilters(newConditions, logic)
    }
  }

  const updateCondition = (index: number, field: keyof SamplingCondition, value: any) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    
    // Clear value when switching to NULL operators
    if (field === 'operator' && (value === 'IS NULL' || value === 'IS NOT NULL')) {
      newConditions[index].value = null
    }
    
    // Reset operator when column changes
    if (field === 'column') {
      const type = columnTypes[value]
      const availableOps = getOperatorsForType(type)
      if (!availableOps.includes(newConditions[index].operator)) {
        newConditions[index].operator = availableOps[0] as any
      }
    }
    
    setConditions(newConditions)
    updateFilters(newConditions, logic)
  }

  const updateLogic = (newLogic: 'AND' | 'OR') => {
    setLogic(newLogic)
    updateFilters(conditions, newLogic)
  }

  const updateFilters = (conds: SamplingCondition[], log: 'AND' | 'OR') => {
    if (conds.length === 0) {
      onFiltersChange(undefined)
    } else {
      onFiltersChange({
        conditions: conds,
        logic: log
      })
    }
  }

  const toggleFilters = () => {
    if (isEnabled) {
      setIsEnabled(false)
      setConditions([])
      onFiltersChange(undefined)
    } else {
      setIsEnabled(true)
      if (conditions.length === 0) {
        addCondition()
      }
    }
  }

  const parseValue = (value: string, operator: string, type?: string) => {
    if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
      return null
    }
    
    if (operator === 'IN' || operator === 'NOT IN') {
      return value.split(',').map(v => v.trim())
    }
    
    const upperType = type?.toUpperCase() || ''
    if (upperType.includes('INT') || upperType.includes('BIGINT')) {
      return parseInt(value)
    }
    if (upperType.includes('DECIMAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
      return parseFloat(value)
    }
    if (upperType.includes('BOOL')) {
      return value.toLowerCase() === 'true'
    }
    
    return value
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Row Filtering</CardTitle>
            <CardDescription className="text-xs">
              Filter rows before sampling
            </CardDescription>
          </div>
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleFilters}
            className="h-8"
          >
            <Filter className="h-3 w-3 mr-1" />
            {isEnabled ? "Enabled" : "Enable Filters"}
          </Button>
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-4">
          <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as 'simple' | 'advanced')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Simple Filter
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Advanced Expression
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4">
              {conditions.length > 1 && (
                <RadioGroup value={logic} onValueChange={(v) => updateLogic(v as 'AND' | 'OR')}>
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Combine conditions with:</Label>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="AND" id="and" />
                      <Label htmlFor="and" className="font-normal cursor-pointer">AND</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="OR" id="or" />
                      <Label htmlFor="or" className="font-normal cursor-pointer">OR</Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              <ScrollArea className={cn(
            "w-full",
            conditions.length > 3 ? "h-[300px] pr-4" : ""
          )}>
            <div className="space-y-3">
              {conditions.map((condition, index) => {
                const type = columnTypes[condition.column]
                const availableOperators = getOperatorsForType(type)
                const samples = sampleValues[condition.column] || []
                const needsValue = condition.operator !== 'IS NULL' && condition.operator !== 'IS NOT NULL'

                return (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            <Label className="text-xs mb-1 block">Column</Label>
                            <Select
                              value={condition.column}
                              onValueChange={(value) => updateCondition(index, 'column', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map(col => (
                                  <SelectItem key={col} value={col}>
                                    <div className="flex items-center gap-2">
                                      {React.createElement(getColumnIcon(columnTypes[col]), { className: "h-3 w-3" })}
                                      <span>{col}</span>
                                      {columnTypes[col] && (
                                        <Badge variant="outline" className="text-[10px] ml-auto">
                                          {columnTypes[col]}
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-3">
                            <Label className="text-xs mb-1 block">Operator</Label>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) => updateCondition(index, 'operator', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableOperators.map(op => (
                                  <SelectItem key={op} value={op}>{op}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-5">
                            <Label className="text-xs mb-1 block">Value</Label>
                            {needsValue ? (
                              <Input
                                placeholder={getPlaceholder(condition.column, condition.operator, type)}
                                value={condition.value || ''}
                                onChange={(e) => updateCondition(index, 'value', parseValue(e.target.value, condition.operator, type))}
                                className="h-9"
                                disabled={!needsValue}
                              />
                            ) : (
                              <div className="h-9 px-3 flex items-center text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-md">
                                No value needed
                              </div>
                            )}
                          </div>
                        </div>

                        {samples.length > 0 && needsValue && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Examples:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {samples.slice(0, 5).map((value, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => updateCondition(index, 'value', parseValue(String(value), condition.operator, type))}
                                >
                                  {String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {conditions.length > 1 && index < conditions.length - 1 && (
                      <div className="mt-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {logic}
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
              </ScrollArea>

              <Separator />

              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Available operators:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li><strong>Text columns:</strong> =, !=, LIKE (pattern match), ILIKE (case-insensitive), IN, NOT IN</li>
                  <li><strong>Numeric columns:</strong> =, !=, &gt;, &lt;, &gt;=, &lt;=, IN, NOT IN</li>
                  <li><strong>Date/Time columns:</strong> =, !=, &gt;, &lt;, &gt;=, &lt;=</li>
                  <li><strong>All columns:</strong> IS NULL, IS NOT NULL</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <TextFilterInput
                columns={columns.map(col => ({
                  id: col,
                  label: col,
                  type: columnTypes[col] || 'text'
                } as Column))}
                value={advancedExpression}
                onChange={setAdvancedExpression}
                onColumnDetected={(column, position) => {
                  console.log('Column detected:', column, 'at position:', position)
                }}
              />
              
              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> The advanced expression filter is currently in preview mode. 
                  Write complex filter expressions using natural language syntax with auto-detected columns and operators.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}