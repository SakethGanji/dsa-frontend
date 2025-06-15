import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Download, 
  Edit, 
  Trash2, 
  Share2, 
  Archive,
  Eye
} from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { Dataset } from '@/lib/api/types';
import type { DatasetActions } from '../types';

interface DatasetCardProps {
  dataset: Dataset;
  actions: DatasetActions;
  isSelected?: boolean;
  onToggleSelection?: (id: number) => void;
}

export function DatasetCard({
  dataset,
  actions,
  isSelected,
  onToggleSelection,
}: DatasetCardProps) {
  return (
    <Card className="relative hover:shadow-md transition-shadow">
      {onToggleSelection && (
        <div className="absolute top-4 left-4 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(dataset.id)}
          />
        </div>
      )}
      
      <CardHeader className={onToggleSelection ? 'pl-12' : ''}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">
              {dataset.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {dataset.description || 'No description'}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onViewDetails(dataset.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(dataset.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDownload(dataset.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onShare(dataset.id)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onArchive(dataset.id)}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => actions.onDelete(dataset.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {dataset.tags && dataset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dataset.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {dataset.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{dataset.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatFileSize(dataset.file_size)}</span>
            <span>{formatDate(dataset.updated_at)}</span>
          </div>
          
          {dataset.version_count && (
            <div className="text-sm text-muted-foreground">
              {dataset.version_count} version{dataset.version_count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <Button 
          className="w-full mt-4" 
          variant="outline"
          onClick={() => actions.onViewDetails(dataset.id)}
        >
          View Dataset
        </Button>
      </CardContent>
    </Card>
  );
}