import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 h-12 w-12 text-muted-foreground/50">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold">{title}</h3>
      
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}