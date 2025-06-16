"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart, PieChart, LineChart, Download, Share2, Loader2 } from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { datasetsApi } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OutputProps {
  onPrevious: () => void
  source: "dataset" | "run"
  sourceId: string | null
}

export default function Output({ onPrevious, source, sourceId }: OutputProps) {
  const [activeTab, setActiveTab] = useState("visualization")
  const [activeChart, setActiveChart] = useState("bar")
  const [profileHtml, setProfileHtml] = useState<string | null>(null)

  // Fetch dataset if source is dataset
  const { data: dataset } = useQuery({
    queryKey: ["dataset", sourceId],
    queryFn: async () => {
      if (!sourceId || source !== "dataset") return null
      try {
        return await datasetsApi.getDatasetById(Number(sourceId))
      } catch (error) {
        console.error("Error fetching dataset:", error)
        return null
      }
    },
    enabled: !!sourceId && source === "dataset"
  })

  // Fetch dataset exploration profile
  const { data: explorationData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["dataset-profile", sourceId, dataset?.current_version],
    queryFn: async () => {
      if (!sourceId || !dataset?.current_version) return null
      try {
        // Try fetching the existing profile first
        const result = await datasetsApi.exploreDataset(
          Number(sourceId), 
          dataset.current_version, 
          { format: "html", run_profiling: true }
        )
        return result
      } catch (error) {
        console.error("Error fetching profile data:", error)
        return null
      }
    },
    enabled: !!sourceId && !!dataset?.current_version
  })

  // Set profile HTML when data is available
  useEffect(() => {
    if (explorationData?.profile) {
      setProfileHtml(explorationData.profile)
    }
  }, [explorationData])

  // Get title based on source
  const getTitle = () => {
    if (source === "dataset") {
      return dataset ? `Analysis Results: ${dataset.name}` : "Dataset Analysis Results"
    } else {
      const runNames: Record<string, string> = {
        run1: "Sales Trend Analysis",
        run2: "Customer Segmentation",
        run3: "Inventory Optimization",
        run4: "Sales Forecast",
      }
      return runNames[sourceId || ""] || "Exploration Run Results"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{getTitle()}</h2>
        <p className="text-muted-foreground mt-1">
          {source === "dataset"
            ? "View analysis results and visualizations from your dataset"
            : "Viewing results from your previously run analysis"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="visualization">Visualizations</TabsTrigger>
          <TabsTrigger value="profile">Pandas Profiling</TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="mt-6">
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChart("bar")}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                activeChart === "bar"
                  ? "bg-primary/20 text-primary"
                  : "border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <BarChart className="mr-2 h-4 w-4" />
              Bar Chart
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChart("pie")}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                activeChart === "pie"
                  ? "bg-primary/20 text-primary"
                  : "border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <PieChart className="mr-2 h-4 w-4" />
              Pie Chart
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChart("line")}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                activeChart === "line"
                  ? "bg-primary/20 text-primary"
                  : "border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <LineChart className="mr-2 h-4 w-4" />
              Line Chart
            </motion.button>
          </div>

          <Card className="border-border bg-card shadow-sm mt-4">
            <CardContent className="p-6">
              <AnimatedChart type={activeChart} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-foreground">Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Records</span>
                    <span className="text-sm font-medium text-foreground">1,245</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Value</span>
                    <span className="text-sm font-medium text-foreground">$187.34</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Highest Value</span>
                    <span className="text-sm font-medium text-foreground">$499.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lowest Value</span>
                    <span className="text-sm font-medium text-foreground">$29.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Standard Deviation</span>
                    <span className="text-sm font-medium text-foreground">$78.21</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Median Value</span>
                    <span className="text-sm font-medium text-foreground">$142.50</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-foreground">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
                      1
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {source === "dataset" && dataset?.file_type === "csv" 
                        ? "The dataset shows strong seasonality in the time series pattern"
                        : "Electronics category has the highest average price"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
                      2
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {source === "dataset" && dataset?.name?.includes("titanic")
                        ? "Survival rates were significantly higher for women and children" 
                        : "20% of products are low in stock"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
                      3
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {source === "dataset" && dataset?.name?.includes("netflix")
                        ? "Content production increased significantly after 2015"
                        : "Clothing has the highest inventory count"}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium text-foreground">
                      Generating profile report...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take a moment depending on the size of your dataset
                    </p>
                  </div>
                </div>
              ) : profileHtml ? (
                <div 
                  className="profile-report-container overflow-visible"
                  style={{ maxHeight: 'none', height: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: profileHtml }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-lg font-medium text-foreground">
                    No profile data available
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try regenerating the profile or select another dataset
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Results
        </motion.button>
      </div>
    </div>
  )
}

function AnimatedChart({ type }: { type: string }) {
  const barChartVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const barVariants = {
    hidden: { height: 0 },
    visible: {
      height: "100%",
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  }

  const pieChartVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  }

  const lineChartVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1, ease: "easeInOut" },
    },
  }

  if (type === "bar") {
    const data = [65, 40, 85, 30, 55]
    const categories = ["Electronics", "Clothing", "Home", "Accessories", "Other"]

    return (
      <div className="h-64">
        <h3 className="mb-4 text-lg font-medium text-foreground">Sales by Category</h3>
        <motion.div
          className="flex h-48 items-end justify-around"
          variants={barChartVariants}
          initial="hidden"
          animate="visible"
        >
          {data.map((value, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="relative h-40 w-12">
                <motion.div
                  className="absolute bottom-0 w-full rounded-t-md bg-primary"
                  style={{ height: `${value}%` }}
                  variants={barVariants}
                />
              </div>
              <span className="mt-2 text-xs text-muted-foreground">{categories[index]}</span>
            </div>
          ))}
        </motion.div>
      </div>
    )
  }

  if (type === "pie") {
    return (
      <div className="flex h-64 items-center justify-center">
        <h3 className="absolute text-lg font-medium text-foreground">Inventory Distribution</h3>
        <motion.svg
          width="200"
          height="200"
          viewBox="0 0 100 100"
          variants={pieChartVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#8b5cf6"
            strokeWidth="20"
            strokeDasharray="251.2 251.2"
            strokeDashoffset="0"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#ec4899"
            strokeWidth="20"
            strokeDasharray="251.2 251.2"
            strokeDashoffset="188.4"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#14b8a6"
            strokeWidth="20"
            strokeDasharray="251.2 251.2"
            strokeDashoffset="125.6"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="20"
            strokeDasharray="251.2 251.2"
            strokeDashoffset="62.8"
          />
        </motion.svg>
        <div className="ml-8 space-y-2">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-primary"></div>
            <span className="ml-2 text-xs text-muted-foreground">Electronics (40%)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-pink-500 dark:bg-pink-400"></div>
            <span className="ml-2 text-xs text-muted-foreground">Clothing (25%)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-teal-500 dark:bg-teal-400"></div>
            <span className="ml-2 text-xs text-muted-foreground">Home (20%)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-amber-500 dark:bg-amber-400"></div>
            <span className="ml-2 text-xs text-muted-foreground">Accessories (15%)</span>
          </div>
        </div>
      </div>
    )
  }

  if (type === "line") {
    return (
      <div className="h-64">
        <h3 className="mb-4 text-lg font-medium text-foreground">Monthly Sales Trend</h3>
        <div className="relative h-48">
          <svg width="100%" height="100%" viewBox="0 0 500 200">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="500" y2="0" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="50" x2="500" y2="50" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="100" x2="500" y2="100" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="150" x2="500" y2="150" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="200" x2="500" y2="200" stroke="#f3f4f6" strokeWidth="1" />

            {/* X-axis labels */}
            <text x="50" y="220" fontSize="10" textAnchor="middle" fill="#6b7280">
              Jan
            </text>
            <text x="125" y="220" fontSize="10" textAnchor="middle" fill="#6b7280">
              Feb
            </text>
            <text x="200" y="220" fontSize="10" textAnchor="middle" fill="#6b7280">
              Mar
            </text>
            <text x="275" y="220" fontSize="10" textAnchor="middle" fill="#6b7280">
              Apr
            </text>
            <text x="350" y="220" fontSize="10" textAnchor="middle" fill="#6b7280">
              May
            </text>
            <text x="425" y="220" fontSize="10" textAnchor="middle" fill="#6b7280">
              Jun
            </text>

            {/* Line chart */}
            <motion.path
              d="M50,150 L125,100 L200,120 L275,80 L350,60 L425,30"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              variants={lineChartVariants}
              initial="hidden"
              animate="visible"
            />

            {/* Data points */}
            <motion.circle
              cx="50"
              cy="150"
              r="5"
              fill="#8b5cf6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            />
            <motion.circle
              cx="125"
              cy="100"
              r="5"
              fill="#8b5cf6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            />
            <motion.circle
              cx="200"
              cy="120"
              r="5"
              fill="#8b5cf6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            />
            <motion.circle
              cx="275"
              cy="80"
              r="5"
              fill="#8b5cf6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            />
            <motion.circle
              cx="350"
              cy="60"
              r="5"
              fill="#8b5cf6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            />
            <motion.circle
              cx="425"
              cy="30"
              r="5"
              fill="#8b5cf6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            />
          </svg>
        </div>
      </div>
    )
  }

  return null
}