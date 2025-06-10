import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Trash2,
  X,
  Filter,
  Layers,
  CircuitBoard,
  Parentheses
} from "lucide-react"
import type { 
  DataFilters,
  DataFilterGroup,
  SamplingCondition,
  FilterOperator
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface AdvancedFilterBuilderProps {
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

type FilterNode = {
  id: string
  type: 'condition' | 'group'
  condition?: SamplingCondition
  group?: {
    logic: 'AND' | 'OR'
    children: FilterNode[]
  }
}

export function AdvancedFilterBuilder({
  columns,
  columnTypes = {},
  sampleValues = {},
  filters,
  onFiltersChange
}: AdvancedFilterBuilderProps) {
  // Convert filters to internal node structure
  const convertToNodes = (filters?: DataFilters): FilterNode => {
    if (!filters) {
      return {
        id: crypto.randomUUID(),
        type: 'group',
        group: {
          logic: 'AND',
          children: []
        }
      }
    }

    const rootNode: FilterNode = {
      id: crypto.randomUUID(),
      type: 'group',
      group: {
        logic: filters.logic || 'AND',
        children: []
      }
    }

    // Add conditions
    if (filters.conditions) {
      filters.conditions.forEach(condition => {
        rootNode.group!.children.push({
          id: crypto.randomUUID(),
          type: 'condition',
          condition
        })
      })
    }

    // Add groups
    if (filters.groups) {
      filters.groups.forEach(group => {
        rootNode.group!.children.push(convertToNodes(group))
      })
    }

    return rootNode
  }

  const [rootNode, setRootNode] = useState<FilterNode>(() => convertToNodes(filters))

  // Convert nodes back to filters
  const convertToFilters = (node: FilterNode): DataFilters | undefined => {
    if (node.type === 'condition') {
      return undefined // Single conditions can't be root
    }

    const group = node.group!
    if (group.children.length === 0) {
      return undefined
    }

    const conditions: SamplingCondition[] = []
    const groups: DataFilterGroup[] = []

    group.children.forEach(child => {
      if (child.type === 'condition' && child.condition) {
        conditions.push(child.condition)
      } else if (child.type === 'group') {
        const childFilters = convertToFilters(child)
        if (childFilters) {
          groups.push(childFilters)
        }
      }
    })

    if (conditions.length === 0 && groups.length === 0) {
      return undefined
    }

    return {
      conditions: conditions.length > 0 ? conditions : undefined,
      groups: groups.length > 0 ? groups : undefined,
      logic: group.logic
    }
  }

  const updateNode = (nodeId: string, updates: Partial<FilterNode>) => {
    const updateRecursive = (node: FilterNode): FilterNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates }
      }
      if (node.type === 'group' && node.group) {
        return {
          ...node,
          group: {
            ...node.group,
            children: node.group.children.map(updateRecursive)
          }
        }
      }
      return node
    }

    const newRoot = updateRecursive(rootNode)
    setRootNode(newRoot)
    onFiltersChange(convertToFilters(newRoot))
  }

  const addCondition = (parentId: string) => {
    const newCondition: FilterNode = {
      id: crypto.randomUUID(),
      type: 'condition',
      condition: {
        column: columns[0] || '',
        operator: '=',
        value: ''
      }
    }

    const addToParent = (node: FilterNode): FilterNode => {
      if (node.id === parentId && node.type === 'group' && node.group) {
        return {
          ...node,
          group: {
            ...node.group,
            children: [...node.group.children, newCondition]
          }
        }
      }
      if (node.type === 'group' && node.group) {
        return {
          ...node,
          group: {
            ...node.group,
            children: node.group.children.map(addToParent)
          }
        }
      }
      return node
    }

    const newRoot = addToParent(rootNode)
    setRootNode(newRoot)
    onFiltersChange(convertToFilters(newRoot))
  }

  const addGroup = (parentId: string) => {
    const newGroup: FilterNode = {
      id: crypto.randomUUID(),
      type: 'group',
      group: {
        logic: 'AND',
        children: []
      }
    }

    const addToParent = (node: FilterNode): FilterNode => {
      if (node.id === parentId && node.type === 'group' && node.group) {
        return {
          ...node,
          group: {
            ...node.group,
            children: [...node.group.children, newGroup]
          }
        }
      }
      if (node.type === 'group' && node.group) {
        return {
          ...node,
          group: {
            ...node.group,
            children: node.group.children.map(addToParent)
          }
        }
      }
      return node
    }

    const newRoot = addToParent(rootNode)
    setRootNode(newRoot)
    onFiltersChange(convertToFilters(newRoot))
  }

  const removeNode = (nodeId: string) => {
    const removeFromParent = (node: FilterNode): FilterNode => {
      if (node.type === 'group' && node.group) {
        return {
          ...node,
          group: {
            ...node.group,
            children: node.group.children
              .filter(child => child.id !== nodeId)
              .map(removeFromParent)
          }
        }
      }
      return node
    }

    const newRoot = removeFromParent(rootNode)
    setRootNode(newRoot)
    onFiltersChange(convertToFilters(newRoot))
  }

  const renderNode = (node: FilterNode, depth: number = 0): React.ReactNode => {
    if (node.type === 'condition' && node.condition) {
      const columnType = columnTypes[node.condition.column] || 'string'
      const availableOps = operators[columnType] || operators.default
      const needsValue = !['is null', 'is not null'].includes(node.condition.operator)

      return (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex items-center gap-2 group"
        >
          <Select
            value={node.condition.column}
            onValueChange={(value) => {
              updateNode(node.id, {
                condition: { ...node.condition, column: value }
              })
            }}
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
            value={node.condition.operator}
            onValueChange={(value) => {
              updateNode(node.id, {
                condition: { ...node.condition, operator: value as FilterOperator }
              })
            }}
          >
            <SelectTrigger className="w-[140px]">
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
              value={String(node.condition.value || '')}
              onChange={(e) => {
                updateNode(node.id, {
                  condition: { ...node.condition, value: e.target.value }
                })
              }}
              placeholder="Enter value"
              className="w-[200px]"
            />
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeNode(node.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )
    }

    if (node.type === 'group' && node.group) {
      const isRoot = depth === 0

      return (
        <motion.div
          key={node.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "space-y-3",
            !isRoot && "pl-8 border-l-2 border-muted"
          )}
        >
          {!isRoot && (
            <div className="flex items-center gap-2 -ml-8">
              <div className="w-8 h-px bg-muted" />
              <Badge variant="secondary" className="gap-1">
                <Parentheses className="w-3 h-3" />
                Group
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeNode(node.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <RadioGroup
            value={node.group.logic}
            onValueChange={(value) => {
              updateNode(node.id, {
                group: { ...node.group, logic: value as 'AND' | 'OR' }
              })
            }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AND" id={`${node.id}-and`} />
              <Label htmlFor={`${node.id}-and`} className="font-medium">
                AND
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OR" id={`${node.id}-or`} />
              <Label htmlFor={`${node.id}-or`} className="font-medium">
                OR
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <AnimatePresence>
              {node.group.children.map((child, index) => (
                <div key={child.id}>
                  {index > 0 && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground px-2">
                        {node.group!.logic}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  {renderNode(child, depth + 1)}
                </div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCondition(node.id)}
              className="gap-2"
            >
              <Filter className="h-3 w-3" />
              Add Condition
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addGroup(node.id)}
              className="gap-2"
            >
              <Layers className="h-3 w-3" />
              Add Group
            </Button>
          </div>
        </motion.div>
      )
    }

    return null
  }

  const hasFilters = rootNode.group && rootNode.group.children.length > 0

  return (
    <div className="space-y-4">
      {hasFilters ? (
        renderNode(rootNode)
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CircuitBoard className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No filters configured. Add conditions to filter your data.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addCondition(rootNode.id)}
                className="gap-2"
              >
                <Filter className="h-3 w-3" />
                Add Condition
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addGroup(rootNode.id)}
                className="gap-2"
              >
                <Layers className="h-3 w-3" />
                Add Group
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRootNode({
                id: crypto.randomUUID(),
                type: 'group',
                group: {
                  logic: 'AND',
                  children: []
                }
              })
              onFiltersChange(undefined)
            }}
            className="text-destructive"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}