import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Trash2,
  X,
  Filter,
  Layers,
  GripVertical
} from "lucide-react"
import type { 
  DataFilters,
  SamplingCondition,
  FilterOperator
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface FilterBuilderProps {
  columns: string[]
  columnTypes?: Record<string, string>
  sampleValues?: Record<string, any[]>
  filters?: DataFilters
  onFiltersChange: (filters: DataFilters | undefined) => void
}

const operators: Record<string, FilterOperator[]> = {
  string: ['=', '!=', 'like', 'not like', 'in', 'not in', 'is null', 'is not null'],
  number: ['=', '!=', '>', '<', '>=', '<=', 'between', 'in', 'not in', 'is null', 'is not null'],
  boolean: ['=', '!=', 'is null', 'is not null'],
  date: ['=', '!=', '>', '<', '>=', '<=', 'between', 'is null', 'is not null'],
  default: ['=', '!=', 'is null', 'is not null']
}

export function FilterBuilder({
  columns,
  columnTypes = {},
  sampleValues = {},
  filters,
  onFiltersChange
}: FilterBuilderProps) {
  const [logic, setLogic] = useState<'AND' | 'OR'>(filters?.logic || 'AND')
  const [conditions, setConditions] = useState<SamplingCondition[]>(
    filters?.conditions || []
  )
  const [groups, setGroups] = useState<DataFilters[]>(filters?.groups || [])

  const updateFilters = (
    newConditions: SamplingCondition[] = conditions,
    newGroups: DataFilters[] = groups,
    newLogic: 'AND' | 'OR' = logic
  ) => {
    if (newConditions.length === 0 && newGroups.length === 0) {
      onFiltersChange(undefined)
    } else {
      onFiltersChange({
        conditions: newConditions.length > 0 ? newConditions : undefined,
        groups: newGroups.length > 0 ? newGroups : undefined,
        logic: newLogic
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
    updateFilters(newConditions, groups, logic)
  }

  const updateCondition = (index: number, updates: Partial<SamplingCondition>) => {
    const newConditions = conditions.map((cond, i) => 
      i === index ? { ...cond, ...updates } : cond
    )
    setConditions(newConditions)
    updateFilters(newConditions, groups, logic)
  }

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    setConditions(newConditions)
    updateFilters(newConditions, groups, logic)
  }

  const addGroup = () => {
    const newGroup: DataFilters = {
      conditions: [],
      logic: 'AND'
    }
    const newGroups = [...groups, newGroup]
    setGroups(newGroups)
    updateFilters(conditions, newGroups, logic)
  }

  const updateGroup = (index: number, newGroup: DataFilters | undefined) => {
    if (!newGroup) {
      const newGroups = groups.filter((_, i) => i !== index)
      setGroups(newGroups)
      updateFilters(conditions, newGroups, logic)
    } else {
      const newGroups = groups.map((group, i) => 
        i === index ? newGroup : group
      )
      setGroups(newGroups)
      updateFilters(conditions, newGroups, logic)
    }
  }

  const renderCondition = (condition: SamplingCondition, index: number) => {
    const columnType = columnTypes[condition.column] || 'string'
    const availableOps = operators[columnType] || operators.default
    const needsValue = !['is null', 'is not null'].includes(condition.operator)

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex items-center gap-2 group"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
        
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
                <div className="flex items-center gap-2">
                  <span>{col}</span>
                  {columnTypes[col] && (
                    <Badge variant="outline" className="text-xs">
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
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableOps.map(op => (
              <SelectItem key={op} value={op}>{op}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {needsValue && (
          <Input
            value={String(condition.value || '')}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            placeholder="Enter value"
            className="flex-1 max-w-[200px]"
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeCondition(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    )
  }

  const hasContent = conditions.length > 0 || groups.length > 0

  return (
    <div className="space-y-4">
      {hasContent ? (
        <>
          {/* Logic Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Combine filters with:</span>
            <ToggleGroup
              type="single"
              value={logic}
              onValueChange={(value) => {
                if (value) {
                  setLogic(value as 'AND' | 'OR')
                  updateFilters(conditions, groups, value as 'AND' | 'OR')
                }
              }}
            >
              <ToggleGroupItem value="AND" className="px-4">
                AND
              </ToggleGroupItem>
              <ToggleGroupItem value="OR" className="px-4">
                OR
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Conditions and Groups */}
          <div className="space-y-3">
            <AnimatePresence>
              {/* Render conditions */}
              {conditions.map((condition, index) => (
                <div key={`condition-${index}`}>
                  {(index > 0 || groups.length > 0) && (
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs font-medium text-muted-foreground px-2">
                        {logic}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  {renderCondition(condition, index)}
                </div>
              ))}

              {/* Render groups */}
              {groups.map((group, index) => (
                <div key={`group-${index}`}>
                  {(conditions.length > 0 || index > 0) && (
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs font-medium text-muted-foreground px-2">
                        {logic}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="shrink-0 mt-1">
                          Group
                        </Badge>
                        <div className="flex-1">
                          <FilterBuilder
                            columns={columns}
                            columnTypes={columnTypes}
                            sampleValues={sampleValues}
                            filters={group}
                            onFiltersChange={(newGroup) => updateGroup(index, newGroup)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add buttons */}
          <div className="flex gap-2">
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
              variant="outline"
              size="sm"
              onClick={addGroup}
              className="gap-2"
            >
              <Layers className="h-3 w-3" />
              Add Group
            </Button>
          </div>

          {/* Clear button */}
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConditions([])
                setGroups([])
                updateFilters([], [], logic)
              }}
              className="text-destructive"
            >
              Clear All
            </Button>
          </div>
        </>
      ) : (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Filter className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No filters configured. Start by adding a filter.
            </p>
            <Button
              onClick={addCondition}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-3 w-3" />
              Add Filter
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}