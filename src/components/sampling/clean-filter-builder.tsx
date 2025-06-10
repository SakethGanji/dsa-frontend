import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  X,
  Filter,
  Sparkles
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

interface CleanFilterBuilderProps {
  columns: string[]
  columnTypes?: Record<string, string>
  filters?: DataFilters
  onFiltersChange: (filters: DataFilters | undefined) => void
}

const operatorsByType: Record<string, UIOperator[]> = {
  string: ['=', '!=', 'contains', 'not contains', 'starts with', 'ends with'],
  number: ['=', '!=', '>', '<', '>=', '<='],
  boolean: ['=', '!='],
  date: ['=', '!=', '>', '<', '>=', '<='],
  default: ['=', '!=', 'contains', 'not contains']
}

const operatorLabels: Record<UIOperator, string> = {
  '=': 'equals',
  '!=': 'not equals',
  '>': 'greater than',
  '<': 'less than',
  '>=': 'greater or equal',
  '<=': 'less or equal',
  'contains': 'contains',
  'not contains': 'not contains',
  'starts with': 'starts with',
  'ends with': 'ends with'
}

export function CleanFilterBuilder({
  columns,
  columnTypes = {},
  filters,
  onFiltersChange
}: CleanFilterBuilderProps) {
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
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>(
    filters?.logic || 'AND'
  )

  const updateFilters = (newConditions: UICondition[], logic: 'AND' | 'OR' = filterLogic) => {
    if (newConditions.length === 0) {
      onFiltersChange(undefined)
    } else {
      const apiConditions = convertToAPIConditions(newConditions)
      onFiltersChange({
        conditions: apiConditions,
        logic: logic
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

  const clearAll = () => {
    setConditions([])
    onFiltersChange(undefined)
  }

  const getPlaceholder = (column: string, operator: UIOperator): string => {
    const type = columnTypes[column] || 'string'
    
    if (type === 'number') return 'e.g. 100'
    if (type === 'date') return 'YYYY-MM-DD'
    if (type === 'boolean') return 'true or false'
    if (operator.includes('contains')) return 'Enter text to search'
    return 'Enter value'
  }

  return (
    <div className="space-y-4">
      {/* Header with count and logic selector */}
      {conditions.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Filter className="h-3 w-3" />
              {conditions.length} filter{conditions.length > 1 ? 's' : ''}
            </Badge>
            
            {conditions.length > 1 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Match:</Label>
                <div className="flex gap-1">
                  <Button
                    variant={filterLogic === 'AND' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setFilterLogic('AND')
                      updateFilters(conditions, 'AND')
                    }}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterLogic === 'OR' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setFilterLogic('OR')
                      updateFilters(conditions, 'OR')
                    }}
                  >
                    Any
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter conditions */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {conditions.map((condition, index) => {
            const columnType = columnTypes[condition.column] || 'string'
            const availableOps = operatorsByType[columnType] || operatorsByType.default

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Logic indicator between filters */}
                {index > 0 && (
                  <div className="flex items-center justify-center py-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      {filterLogic}
                    </span>
                  </div>
                )}

                {/* Filter row */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 group">
                  {/* Column selector */}
                  <Select
                    value={condition.column}
                    onValueChange={(value) => updateCondition(index, { column: value })}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>
                          <span className="flex items-center gap-2">
                            {col}
                            {columnTypes[col] && (
                              <Badge variant="outline" className="text-[10px] ml-auto">
                                {columnTypes[col]}
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator selector */}
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value as UIOperator })}
                  >
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOps.map(op => (
                        <SelectItem key={op} value={op}>
                          {operatorLabels[op]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value input */}
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder={getPlaceholder(condition.column, condition.operator)}
                    className="flex-1 h-9"
                  />

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeCondition(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Add filter button or empty state */}
      {conditions.length > 0 ? (
        <Button
          onClick={addCondition}
          variant="outline"
          size="sm"
          className="w-full h-9 border-dashed"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add filter
        </Button>
      ) : (
        <div className="text-center py-6 px-4 border border-dashed rounded-lg">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            No filters applied
          </p>
          <Button
            onClick={addCondition}
            size="sm"
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Add your first filter
          </Button>
        </div>
      )}
    </div>
  )
}