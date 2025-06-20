"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  BarChart3, 
  Database, 
  AlertTriangle, 
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Clock,
  Activity
} from "lucide-react"
import { AnalysisBlock } from "@/components/eda"
import type { EDAResponse, VariableAnalysis, AlertListData, Alert } from "@/components/eda/types"
import { cn } from "@/lib/utils"

interface NativeProfileResultsProps {
  data: EDAResponse | null
  isLoading?: boolean
}

interface VariableItemProps {
  name: string
  variable: VariableAnalysis
  isExpanded: boolean
  onToggle: () => void
}

function VariableItem({ name, variable, isExpanded, onToggle }: VariableItemProps) {
  const typeColors = {
    NUMERIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    CATEGORICAL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    DATETIME: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    TEXT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    BOOLEAN: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-base font-mono">{name}</CardTitle>
            <div className="flex gap-2">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", typeColors[variable.common_info.type])}
              >
                {variable.common_info.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {variable.common_info.dtype}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-6 pt-0">
              {variable.analyses.map((analysis, idx) => (
                <AnalysisBlock 
                  key={idx} 
                  block={analysis}
                  className="mt-4"
                />
              ))}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export function NativeProfileResults({ data, isLoading }: NativeProfileResultsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set())
  const [variableSearch, setVariableSearch] = useState("")

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
        <p className="text-gray-500">Analyzing your data with Native Profile...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No analysis results available</p>
      </div>
    )
  }

  // Ensure data has the expected structure
  const safeData: EDAResponse = {
    metadata: data.metadata || {
      dataset_id: 0,
      version_id: 0,
      analysis_timestamp: new Date().toISOString(),
      sample_size_used: 0,
      total_rows: 0,
      total_columns: 0,
      analysis_duration_seconds: 0
    },
    global_summary: Array.isArray(data.global_summary) ? data.global_summary : [],
    variables: data.variables || {},
    interactions: Array.isArray(data.interactions) ? data.interactions : [],
    alerts: Array.isArray(data.alerts) ? data.alerts : []
  }

  const toggleVariable = (name: string) => {
    setExpandedVariables(prev => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      return newSet
    })
  }

  const expandAllVariables = () => {
    setExpandedVariables(new Set(Object.keys(safeData.variables)))
  }

  const collapseAllVariables = () => {
    setExpandedVariables(new Set())
  }

  // Filter variables based on search
  const filteredVariables = Object.entries(safeData.variables).filter(([name]) =>
    name.toLowerCase().includes(variableSearch.toLowerCase())
  )

  // Count alerts by severity
  const alertCounts = safeData.alerts.reduce((acc, alertBlock) => {
    if (alertBlock.render_as === 'ALERT_LIST') {
      (alertBlock.data as AlertListData).alerts.forEach((alert: Alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1
      })
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Metadata Header */}
      {safeData.metadata && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Analysis Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Total Rows
                </p>
                <p className="text-lg font-semibold">
                  {safeData.metadata.total_rows?.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Total Columns
                </p>
                <p className="text-lg font-semibold">
                  {safeData.metadata.total_columns}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Sample Size
                </p>
                <p className="text-lg font-semibold">
                  {safeData.metadata.sample_size_used?.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Analysis Time
                </p>
                <p className="text-lg font-semibold">
                  {safeData.metadata.analysis_duration_seconds?.toFixed(2)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Variables
            <Badge variant="secondary" className="ml-1 text-xs">
              {Object.keys(safeData.variables).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Interactions
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
            {alertCounts.WARNING && (
              <Badge variant="secondary" className="ml-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {alertCounts.WARNING}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Summary</CardTitle>
              <CardDescription>
                High-level overview of your dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {safeData.global_summary.map((block, idx) => (
                <AnalysisBlock key={idx} block={block} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variable Analysis</CardTitle>
                  <CardDescription>
                    Detailed analysis of each variable in your dataset
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAllVariables}
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAllVariables}
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search variables..."
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredVariables.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No variables found matching "{variableSearch}"
                    </p>
                  ) : (
                    filteredVariables.map(([name, variable]) => (
                      <VariableItem
                        key={name}
                        name={name}
                        variable={variable}
                        isExpanded={expandedVariables.has(name)}
                        onToggle={() => toggleVariable(name)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variable Interactions</CardTitle>
              <CardDescription>
                Relationships and correlations between variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {safeData.interactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No significant interactions found
                </p>
              ) : (
                safeData.interactions.map((block, idx) => (
                  <AnalysisBlock key={idx} block={block} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Alerts</CardTitle>
              <CardDescription>
                Potential issues and warnings about your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {safeData.alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No data quality issues detected
                </p>
              ) : (
                safeData.alerts.map((block, idx) => (
                  <AnalysisBlock key={idx} block={block} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}