import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useDeleteDataset } from './index';
import type { DatasetActions } from '../types';

export function useDatasetActions(): DatasetActions {
  const navigate = useNavigate();
  const deleteDataset = useDeleteDataset();

  const onCreate = useCallback(() => {
    // This would typically open a modal or navigate to a create page
    toast.info('Opening dataset creation form...');
  }, []);

  const onEdit = useCallback((id: number) => {
    navigate({ to: `/datasets/${id}/edit` });
  }, [navigate]);

  const onDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this dataset?')) {
      return;
    }

    try {
      await deleteDataset.mutateAsync(id);
      toast.success('Dataset deleted successfully');
    } catch (error) {
      toast.error('Failed to delete dataset');
    }
  }, [deleteDataset]);

  const onDownload = useCallback((id: number) => {
    // Implement download logic
    toast.info(`Downloading dataset ${id}...`);
  }, []);

  const onShare = useCallback((id: number) => {
    // Implement share logic
    toast.info(`Opening share dialog for dataset ${id}...`);
  }, []);

  const onArchive = useCallback((id: number) => {
    // Implement archive logic
    toast.info(`Archiving dataset ${id}...`);
  }, []);

  const onViewDetails = useCallback((id: number) => {
    navigate({ to: `/datasets/${id}` });
  }, [navigate]);

  return {
    onCreate,
    onEdit,
    onDelete,
    onDownload,
    onShare,
    onArchive,
    onViewDetails,
  };
}