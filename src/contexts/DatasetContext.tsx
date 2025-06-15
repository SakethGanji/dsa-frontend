import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import type { Dataset, DatasetVersion } from '@/lib/api/types'

interface DatasetContextValue {
  selectedDataset: Dataset | null
  selectedVersion: DatasetVersion | null
  setSelectedDataset: (dataset: Dataset | null) => void
  setSelectedVersion: (version: DatasetVersion | null) => void
  clearSelection: () => void
}

const DatasetContext = createContext<DatasetContextValue | undefined>(undefined)

const STORAGE_KEY = 'selectedDataset'
const VERSION_STORAGE_KEY = 'selectedVersion'

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [selectedDataset, setSelectedDatasetState] = useState<Dataset | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const [selectedVersion, setSelectedVersionState] = useState<DatasetVersion | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(VERSION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const setSelectedDataset = useCallback((dataset: Dataset | null) => {
    setSelectedDatasetState(dataset)
    // When dataset changes, clear the version
    setSelectedVersionState(null)
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (dataset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      // Clear version from storage when dataset changes
      localStorage.removeItem(VERSION_STORAGE_KEY)
    }
  }, [])

  const setSelectedVersion = useCallback((version: DatasetVersion | null) => {
    setSelectedVersionState(version)
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (version) {
        localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(version))
      } else {
        localStorage.removeItem(VERSION_STORAGE_KEY)
      }
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedDatasetState(null)
    setSelectedVersionState(null)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(VERSION_STORAGE_KEY)
    }
  }, [])

  // Sync with other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSelectedDatasetState(e.newValue ? JSON.parse(e.newValue) : null)
      } else if (e.key === VERSION_STORAGE_KEY) {
        setSelectedVersionState(e.newValue ? JSON.parse(e.newValue) : null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const value: DatasetContextValue = {
    selectedDataset,
    selectedVersion,
    setSelectedDataset,
    setSelectedVersion,
    clearSelection,
  }

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

export function useDatasetContext() {
  const context = useContext(DatasetContext)
  if (!context) {
    throw new Error('useDatasetContext must be used within a DatasetProvider')
  }
  return context
}