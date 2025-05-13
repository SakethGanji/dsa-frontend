"use client"

import { type Dispatch, type SetStateAction, useState } from "react"
import { motion } from "framer-motion"
import { Check, CheckCircle, Clock, AlertCircle, Search } from "lucide-react"

interface ExplorationRunsProps {
  onNext: () => void
  selectedRun: string | null
  setSelectedRun: Dispatch<SetStateAction<string | null>>
}

export default function ExplorationRuns({ onNext, selectedRun, setSelectedRun }: ExplorationRunsProps) {
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Mock exploration runs - in a real app, this would come from an API
  const explorationRuns = [
    {
      id: "run1",
      name: "Sales Trend Analysis",
      dataset: "Sales Data",
      created: "May 10, 2025",
      status: "completed",
      charts: 4,
      insights: 3,
    },
    {
      id: "run2",
      name: "Customer Segmentation",
      dataset: "Customer Database",
      created: "May 9, 2025",
      status: "completed",
      charts: 6,
      insights: 5,
    },
    {
      id: "run3",
      name: "Inventory Optimization",
      dataset: "Inventory",
      created: "May 8, 2025",
      status: "in_progress",
      charts: 2,
      insights: 1,
    },
    {
      id: "run4",
      name: "Sales Forecast",
      dataset: "Sales Data",
      created: "May 7, 2025",
      status: "failed",
      charts: 0,
      insights: 0,
    },
  ]

  // Filter runs by status and search term
  const filteredRuns = explorationRuns
    .filter(run => !filterStatus || run.status === filterStatus)
    .filter(run => 
      !searchTerm || 
      run.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      run.dataset.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "in_progress":
        return "In Progress"
      case "failed":
        return "Failed"
      default:
        return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
      case "in_progress":
        return "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
      case "failed":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search exploration runs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-800 dark:text-gray-200 focus:border-violet-300 dark:focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/20"
          />
        </div>

        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilterStatus(null)}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              filterStatus === null 
                ? "bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilterStatus("completed")}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              filterStatus === "completed"
                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Completed
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilterStatus("in_progress")}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              filterStatus === "in_progress"
                ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            In Progress
          </motion.button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredRuns.length > 0 ? (
          filteredRuns.map((run, index) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRun(run.id)}
              className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                selectedRun === run.id
                  ? "border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-sm"
              }`}
            >
              {selectedRun === run.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white"
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              )}
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">{run.name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(run.status)}`}
                >
                  {getStatusIcon(run.status)}
                  <span className="ml-1">{getStatusText(run.status)}</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Dataset: {run.dataset}</p>
              <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Created: {run.created}</span>
                <span>
                  {run.charts} charts • {run.insights} insights
                </span>
              </div>
              {run.status === "in_progress" && (
                <motion.div
                  className="mt-3 h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: "30%" }}
                    animate={{ width: ["30%", "60%", "45%", "70%"] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No exploration runs found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}