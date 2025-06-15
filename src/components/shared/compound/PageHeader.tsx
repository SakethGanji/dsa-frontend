import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: boolean;
  backTo?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backButton,
  backTo,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate({ to: backTo });
    } else {
      window.history.back();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumb && <div>{breadcrumb}</div>}
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            {backButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          </div>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}