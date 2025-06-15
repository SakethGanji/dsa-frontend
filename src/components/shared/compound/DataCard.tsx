import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DataCardProps {
  children: ReactNode;
  className?: string;
}

interface DataCardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

interface DataCardContentProps {
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

interface DataCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function DataCard({ children, className }: DataCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {children}
    </Card>
  );
}

DataCard.Header = function DataCardHeader({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}: DataCardHeaderProps) {
  return (
    <CardHeader className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <CardTitle>{title}</CardTitle>
          </div>
          {description && (
            <CardDescription className="mt-1.5">{description}</CardDescription>
          )}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    </CardHeader>
  );
};

DataCard.Content = function DataCardContent({ 
  children, 
  className, 
  loading 
}: DataCardContentProps) {
  if (loading) {
    return (
      <CardContent className={className}>
        <div className="space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </CardContent>
    );
  }

  return <CardContent className={className}>{children}</CardContent>;
};

DataCard.Footer = function DataCardFooter({ children, className }: DataCardFooterProps) {
  return <CardFooter className={className}>{children}</CardFooter>;
};