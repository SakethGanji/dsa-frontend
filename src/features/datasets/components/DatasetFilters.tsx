import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import type { DatasetFilter } from '../types';

interface DatasetFiltersProps {
  filters: DatasetFilter;
  onFiltersChange: (filters: Partial<DatasetFilter>) => void;
  availableTags: string[];
}

export function DatasetFilters({
  filters,
  onFiltersChange,
  availableTags,
}: DatasetFiltersProps) {
  const activeFilterCount = [
    filters.tags?.length,
    filters.status,
    filters.owner,
    filters.dateRange,
  ].filter(Boolean).length;

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    onFiltersChange({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({
      tags: undefined,
      status: undefined,
      owner: undefined,
      dateRange: undefined,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Tags */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Tags
          </DropdownMenuLabel>
          {availableTags.map(tag => (
            <DropdownMenuCheckboxItem
              key={tag}
              checked={filters.tags?.includes(tag)}
              onCheckedChange={() => handleTagToggle(tag)}
            >
              {tag}
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Status */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Status
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'active'}
            onCheckedChange={(checked) => 
              onFiltersChange({ status: checked ? 'active' : undefined })
            }
          >
            Active
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'archived'}
            onCheckedChange={(checked) => 
              onFiltersChange({ status: checked ? 'archived' : undefined })
            }
          >
            Archived
          </DropdownMenuCheckboxItem>
          
          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={clearFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Active filter badges */}
      {filters.tags && filters.tags.length > 0 && (
        <div className="flex gap-1">
          {filters.tags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1"
            >
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}