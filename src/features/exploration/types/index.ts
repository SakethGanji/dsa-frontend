export interface ExplorationStep {
  id: number;
  title: string;
  subtitle: string;
}

export interface AnalysisOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface PreviousAnalysis {
  id: number;
  type: string;
  name: string;
  date: string;
  status: 'completed' | 'failed' | 'processing';
  insights?: number;
  quality?: string;
}

export interface ExplorationState {
  currentStep: number;
  selectedDataset: Dataset | null;
  selectedVersion: DatasetVersion | null;
  selectedAnalysis: string | null;
  isAnalyzing: boolean;
  showPreviousAnalyses: boolean;
  viewingPrevious: boolean;
}

export interface ExplorationActions {
  selectDataset: (dataset: Dataset) => void;
  selectVersion: (version: DatasetVersion) => void;
  selectAnalysis: (analysisId: string) => void;
  goToStep: (step: number) => void;
  runAnalysis: () => void;
  viewPreviousAnalysis: (analysisId: number) => void;
  runNewAnalysis: () => void;
  reset: () => void;
}

// Import types from API
import type { Dataset, DatasetVersion } from '@/lib/api/types';