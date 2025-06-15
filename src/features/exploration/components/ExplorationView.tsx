import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StepNavigation, LoadingOverlay } from '@/components/shared';
import { useExplorationState } from '../hooks/useExplorationState';
import { useExploreDataset } from '@/hooks/use-exploration-query';
import { createProfileRequest } from '@/hooks/use-exploration-query';
import { DatasetSelectionStep } from './DatasetSelectionStep';
import { VersionSelectionStep } from './VersionSelectionStep';
import { DataPreviewStep } from './DataPreviewStep';
import { AnalysisSelectionStep } from './AnalysisSelectionStep';
import { AnalysisResultsStep } from './AnalysisResultsStep';
import type { ExplorationStep } from '../types';

const stepInfo: Record<number, ExplorationStep> = {
  1: { id: 1, title: 'Select Dataset', subtitle: 'Choose data source' },
  2: { id: 2, title: 'Select Version', subtitle: 'Pick dataset version' },
  3: { id: 3, title: 'Explore Data', subtitle: 'Preview and examine' },
  4: { id: 4, title: 'Choose Analysis', subtitle: 'Select analysis type' },
  5: { id: 5, title: 'View Results', subtitle: 'Review insights' },
};

export function ExplorationView() {
  const [state, actions] = useExplorationState();
  const exploreMutation = useExploreDataset<{ profile?: string }>();

  // Check for previous analyses
  useEffect(() => {
    if (state.selectedVersion && state.selectedDataset) {
      const profileKey = `profile_${state.selectedDataset.id}_${state.selectedVersion.id}`;
      const existingProfile = sessionStorage.getItem(profileKey);
      if (existingProfile) {
        actions.showPreviousAnalyses?.(true);
      }
    }
  }, [state.selectedVersion, state.selectedDataset, actions]);

  const handleAnalysisRun = () => {
    if (!state.selectedDataset || !state.selectedVersion || !state.selectedAnalysis) {
      return;
    }

    actions.runAnalysis();

    exploreMutation.mutate(
      {
        datasetId: state.selectedDataset.id,
        versionId: state.selectedVersion.id,
        options: createProfileRequest('html'),
      },
      {
        onSuccess: () => {
          actions.goToStep(5);
        },
        onError: () => {
          // Handle error
        },
      }
    );
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <DatasetSelectionStep
            onSelect={actions.selectDataset}
            selectedDataset={state.selectedDataset}
          />
        );
      
      case 2:
        return state.selectedDataset ? (
          <VersionSelectionStep
            dataset={state.selectedDataset}
            onSelect={actions.selectVersion}
            selectedVersion={state.selectedVersion}
          />
        ) : null;
      
      case 3:
        return state.selectedDataset && state.selectedVersion ? (
          <DataPreviewStep
            dataset={state.selectedDataset}
            version={state.selectedVersion}
            onContinue={() => actions.goToStep(4)}
            onViewPrevious={() => actions.viewPreviousAnalysis(1)}
            hasPreviousAnalyses={state.showPreviousAnalyses}
          />
        ) : null;
      
      case 4:
        return (
          <AnalysisSelectionStep
            onSelect={(id) => {
              actions.selectAnalysis(id);
              handleAnalysisRun();
            }}
            selectedAnalysis={state.selectedAnalysis}
            isAnalyzing={state.isAnalyzing}
          />
        );
      
      case 5:
        return state.selectedDataset && state.selectedVersion ? (
          <AnalysisResultsStep
            dataset={state.selectedDataset}
            version={state.selectedVersion}
            analysisType={state.selectedAnalysis}
            profileData={exploreMutation.data?.profile}
            onNewAnalysis={actions.runNewAnalysis}
            onReset={actions.reset}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-0 lg:-mt-0">
      <div className="w-full h-full flex flex-col bg-background">
        <StepNavigation
          steps={stepInfo}
          currentStep={state.currentStep}
          completedSteps={Array.from({ length: state.currentStep - 1 }, (_, i) => i + 1)}
        />
        
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {state.isAnalyzing && <LoadingOverlay />}
          
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}