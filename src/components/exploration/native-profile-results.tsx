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
  ChevronRight,
  Search,
  FileText,
  Clock,
  Activity,
  Layers,
  Zap,
  Grid3x3
} from "lucide-react"
import { EnhancedAnalysisBlock, AnalysisGrid } from "@/components/eda"
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
  const typeConfig = {
    NUMERIC: {
      gradient: "from-blue-500/10 to-blue-600/5",
      icon: "📊",
      color: "text-blue-600 dark:text-blue-400"
    },
    CATEGORICAL: {
      gradient: "from-green-500/10 to-green-600/5",
      icon: "🏷️",
      color: "text-green-600 dark:text-green-400"
    },
    DATETIME: {
      gradient: "from-purple-500/10 to-purple-600/5",
      icon: "📅",
      color: "text-purple-600 dark:text-purple-400"
    },
    TEXT: {
      gradient: "from-orange-500/10 to-orange-600/5",
      icon: "📝",
      color: "text-orange-600 dark:text-orange-400"
    },
    BOOLEAN: {
      gradient: "from-pink-500/10 to-pink-600/5",
      icon: "🔘",
      color: "text-pink-600 dark:text-pink-400"
    },
  }

  const config = typeConfig[variable.common_info.type] || typeConfig.NUMERIC

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
        <CardHeader 
          className={cn(
            "cursor-pointer transition-all duration-300 relative overflow-hidden",
            "bg-gradient-to-r", config.gradient,
            "hover:bg-opacity-80"
          )}
          onClick={onToggle}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 -translate-x-full hover:translate-x-full" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={cn("h-5 w-5", config.color)} />
              </motion.div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.icon}</span>
                <CardTitle className={cn("text-base font-mono", config.color)}>
                  {name}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs border-0 bg-white/10 backdrop-blur-sm", config.color)}
                >
                  {variable.common_info.type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-xs border-white/20 bg-white/5 backdrop-blur-sm"
                >
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
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardContent className="pt-6 bg-gradient-to-b from-muted/30 to-transparent">
                <AnalysisGrid 
                  blocks={variable.analyses.map(analysis => ({
                    ...analysis,
                    forceChart: analysis.title === 'Quantile Statistics' || 
                               analysis.title === 'Descriptive Statistics' ||
                               (analysis.render_as === 'KEY_VALUE_PAIRS' && 
                                (Object.keys(analysis.data).some(k => k.includes('Percentile')) ||
                                 Object.keys(analysis.data).some(k => k.includes('Skewness'))))
                  }))}
                />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      Total Rows
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                      {safeData.metadata.total_rows?.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                    <Layers className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Grid3x3 className="h-4 w-4 text-green-500" />
                      Total Columns
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                      {safeData.metadata.total_columns}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-500" />
                      Sample Size
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                      {safeData.metadata.sample_size_used?.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      Analysis Time
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                      {safeData.metadata.analysis_duration_seconds?.toFixed(2)}s
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
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
            <CardContent>
              <AnalysisGrid 
                blocks={safeData.global_summary.map(block => ({
                  ...block,
                  forceChart: block.render_as === 'KEY_VALUE_PAIRS' && block.title?.includes('Statistics')
                }))}
              />
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
            <CardContent>
              {safeData.interactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No significant interactions found
                </p>
              ) : (
                <AnalysisGrid blocks={safeData.interactions} />
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
            <CardContent>
              {safeData.alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No data quality issues detected
                </p>
              ) : (
                <AnalysisGrid blocks={safeData.alerts} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}