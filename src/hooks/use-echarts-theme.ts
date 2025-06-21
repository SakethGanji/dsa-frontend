import { useTheme } from "@/components/theme-provider"
import { useEffect, useState } from "react"

export function useEChartsTheme() {
  const { theme } = useTheme()
  const [echartsTheme, setEchartsTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setEchartsTheme(systemTheme)
      } else {
        setEchartsTheme(theme as 'light' | 'dark')
      }
    }

    updateTheme()

    // Listen for system theme changes when in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => updateTheme()
      
      // Check if addEventListener is supported
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }
  }, [theme])

  return echartsTheme
}