import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api/index"
import type { MultiRoundSamplingRequest, MultiRoundSamplingResponse } from "@/lib/api/types"

interface UseMultiRoundSamplingOptions {
  onSuccess?: (data: MultiRoundSamplingResponse) => void
  onError?: (error: Error) => void
}

interface MultiRoundSamplingMutationParams {
  datasetId: number
  versionId: number
  request: MultiRoundSamplingRequest
  page?: number
  pageSize?: number
}

export function useMultiRoundSampling(options?: UseMultiRoundSamplingOptions) {
  return useMutation<MultiRoundSamplingResponse, Error, MultiRoundSamplingMutationParams>({
    mutationFn: async ({ datasetId, versionId, request, page, pageSize }) => {
      return api.sampling.executeMultiRound(datasetId, versionId, request, page, pageSize)
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}