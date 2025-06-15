import { useReducer, useCallback } from 'react';
import type { ExplorationState, ExplorationActions } from '../types';
import type { Dataset, DatasetVersion } from '@/lib/api/types';

type ExplorationAction =
  | { type: 'SELECT_DATASET'; payload: Dataset }
  | { type: 'SELECT_VERSION'; payload: DatasetVersion }
  | { type: 'SELECT_ANALYSIS'; payload: string }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'START_ANALYSIS' }
  | { type: 'COMPLETE_ANALYSIS' }
  | { type: 'SHOW_PREVIOUS_ANALYSES'; payload: boolean }
  | { type: 'VIEW_PREVIOUS'; payload: boolean }
  | { type: 'RESET' };

const initialState: ExplorationState = {
  currentStep: 1,
  selectedDataset: null,
  selectedVersion: null,
  selectedAnalysis: null,
  isAnalyzing: false,
  showPreviousAnalyses: false,
  viewingPrevious: false,
};

function explorationReducer(
  state: ExplorationState,
  action: ExplorationAction
): ExplorationState {
  switch (action.type) {
    case 'SELECT_DATASET':
      return {
        ...state,
        selectedDataset: action.payload,
        selectedVersion: null,
        selectedAnalysis: null,
        currentStep: 2,
      };
    
    case 'SELECT_VERSION':
      return {
        ...state,
        selectedVersion: action.payload,
        selectedAnalysis: null,
        currentStep: 3,
      };
    
    case 'SELECT_ANALYSIS':
      return {
        ...state,
        selectedAnalysis: action.payload,
      };
    
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    
    case 'START_ANALYSIS':
      return {
        ...state,
        isAnalyzing: true,
      };
    
    case 'COMPLETE_ANALYSIS':
      return {
        ...state,
        isAnalyzing: false,
        currentStep: 5,
      };
    
    case 'SHOW_PREVIOUS_ANALYSES':
      return {
        ...state,
        showPreviousAnalyses: action.payload,
      };
    
    case 'VIEW_PREVIOUS':
      return {
        ...state,
        viewingPrevious: action.payload,
        currentStep: action.payload ? 5 : state.currentStep,
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

export function useExplorationState(): [ExplorationState, ExplorationActions] {
  const [state, dispatch] = useReducer(explorationReducer, initialState);

  const actions: ExplorationActions = {
    selectDataset: useCallback((dataset: Dataset) => {
      dispatch({ type: 'SELECT_DATASET', payload: dataset });
    }, []),

    selectVersion: useCallback((version: DatasetVersion) => {
      dispatch({ type: 'SELECT_VERSION', payload: version });
    }, []),

    selectAnalysis: useCallback((analysisId: string) => {
      dispatch({ type: 'SELECT_ANALYSIS', payload: analysisId });
    }, []),

    goToStep: useCallback((step: number) => {
      dispatch({ type: 'GO_TO_STEP', payload: step });
    }, []),

    runAnalysis: useCallback(() => {
      dispatch({ type: 'START_ANALYSIS' });
    }, []),

    viewPreviousAnalysis: useCallback((analysisId: number) => {
      dispatch({ type: 'VIEW_PREVIOUS', payload: true });
    }, []),

    runNewAnalysis: useCallback(() => {
      dispatch({ type: 'SHOW_PREVIOUS_ANALYSES', payload: false });
      dispatch({ type: 'VIEW_PREVIOUS', payload: false });
      dispatch({ type: 'GO_TO_STEP', payload: 4 });
    }, []),

    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, []),
  };

  return [state, actions];
}