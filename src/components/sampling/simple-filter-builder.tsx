import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  SamplingCondition,
  FilterOperator
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface SimpleFilterBuilderProps {
  columns: string[]
  columnTypes?: Record<string, string>
  sampleValues?: Record<string, any[]>
  filters?: DataFilters
  onFiltersChange: (filters: DataFilters | undefined) => void
}

const operators: Record<string, FilterOperator[]> = {
  string: ['=', '!=', 'contains', 'not contains', 'starts with', 'ends with'],
  number: ['=', '!=', '>', '<', '>=', '<='],
  boolean: ['=', '!='],
  date: ['=', '!=', '>', '<', '>=', '<='],
  default: ['=', '!=']
}

const operatorLabels: Record<string, string> = {
  '=': 'equals',
  '!=': 'not equals',
  '>': 'greater than',
  '<': 'less than',
  '>=': 'greater or equal',
  '<=': 'less or equal',
  'like': 'contains',
  'not like': 'not contains',
  'contains': 'contains',
  'not contains': 'not contains',
  'starts with': 'starts with',
  'ends with': 'ends with'
}

export function SimpleFilterBuilder({
  columns,
  columnTypes = {},
  sampleValues = {},
  filters,
  onFiltersChange
}: SimpleFilterBuilderProps) {
  const [conditions, setConditions] = useState<SamplingCondition[]>(
    filters?.conditions || []
  )
  const [useOrLogic, setUseOrLogic] = useState(filters?.logic === 'OR')

  const updateFilters = (newConditions: SamplingCondition[], orLogic: boolean = useOrLogic) => {
    if (newConditions.length === 0) {
      onFiltersChange(undefined)
    } else {
      // Map UI-friendly operators to SQL operators
      const mappedConditions = newConditions.map(cond => ({
        ...cond,
        operator: (
          cond.operator === 'contains' ? 'like' :
          cond.operator === 'not contains' ? 'not like' :
          cond.operator === 'starts with' ? 'like' :
          cond.operator === 'ends with' ? 'like' :
          cond.operator
        ) as FilterOperator,
        value: 
          cond.operator === 'contains' || cond.operator === 'not contains' ? `%${cond.value}%` :
          cond.operator === 'starts with' ? `${cond.value}%` :
          cond.operator === 'ends with' ? `%${cond.value}` :
          cond.value
      }))

      onFiltersChange({
        conditions: mappedConditions,
        logic: orLogic ? 'OR' : 'AND'
      })
    }
  }

  const addCondition = () => {
    const newCondition: SamplingCondition = {
      column: columns[0] || '',
      operator: '=',
      value: ''
    }
    const newConditions = [...conditions, newCondition]
    setConditions(newConditions)
    updateFilters(newConditions)
  }

  const updateCondition = (index: number, updates: Partial<SamplingCondition>) => {
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

  const getPlaceholder = (column: string, operator: string): string => {
    const type = columnTypes[column] || 'string'
    const samples = sampleValues[column]
    
    if (samples && samples.length > 0) {
      return `e.g. ${samples[0]}`
    }
    
    switch (type) {
      case 'number':
        return 'Enter number'
      case 'boolean':
        return 'true or false'
      case 'date':
        return 'YYYY-MM-DD'
      default:
        return operator.includes('contains') ? 'Enter text' : 'Enter value'
    }
  }

  return (
    <div className="space-y-4">
      {conditions.length > 0 ? (
        <>
          {/* Filters */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {conditions.map((condition, index) => {
                const columnType = columnTypes[condition.column] || 'string'
                const availableOps = operators[columnType] || operators.default

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {index > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-px bg-border" />
                        <Badge 
                          variant={useOrLogic ? "secondary" : "default"} 
                          className="text-xs px-2 py-0.5"
                        >
                          {useOrLogic ? 'OR' : 'AND'}
                        </Badge>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 group">
                      <Select
                        value={condition.column}
                        onValueChange={(value) => updateCondition(index, { column: value })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(col => (
                            <SelectItem key={col} value={col}>
                              <div className="flex items-center justify-between w-full">
                                <span>{col}</span>
                                {columnTypes[col] && (
                                  <Badge variant="outline" className="text-[10px] ml-2">
                                    {columnTypes[col]}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, { operator: value as FilterOperator })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOps.map(op => (
                            <SelectItem key={op} value={op}>
                              {operatorLabels[op] || op}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder={getPlaceholder(condition.column, condition.operator)}
                        className="flex-1 max-w-[200px]"
                      />

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
                    onCheckedChange={(checked) => {
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

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={addCondition}
              className="gap-2"
            >
              <Plus className="h-3 w-3" />
              Add Filter
            </Button>
            
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
        </>
      ) : (
        /* Empty state */
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
      )}
    </div>
  )
}