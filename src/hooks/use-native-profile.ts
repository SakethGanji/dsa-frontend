import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api/index'

export interface NativeProfileConfig {
  global_summary: boolean
  variables: {
    enabled: boolean
    limit: number
    types: ('numeric' | 'categorical' | 'datetime' | 'text')[]
  }
  interactions: {
    enabled: boolean
    correlation_threshold: number
    max_pairs: number
  }
  missing_values: boolean
  alerts: {
    enabled: boolean
  }
  sample_size?: number
}

export interface NativeProfileRequest {
  analysis_config: NativeProfileConfig
}

export function useNativeProfile() {
  return useMutation({
    mutationFn: async ({ 
      datasetId, 
      versionId, 
      config 
    }: { 
      datasetId: number
      versionId: number
      config: NativeProfileConfig
    }) => {
      return api.explore.runEDA(datasetId, versionId, {
        analysis_config: config
      })
    }
  })
}

// Default configuration for native profile analysis
export const defaultNativeProfileConfig: NativeProfileConfig = {
  global_summary: true,
  variables: {
    enabled: true,
    limit: 50,
    types: ['numeric', 'categorical', 'datetime', 'text']
  },
  interactions: {
    enabled: true,
    correlation_threshold: 0.5,
    max_pairs: 20
  },
  missing_values: true,
  alerts: {
    enabled: true
  },
  sample_size: 0
}