import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
  loading,
  className,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-4 w-4" />;
    return change > 0 ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950';
      case 'danger':
        return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className={cn(getVariantStyles(), className)}>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(getVariantStyles(), className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                {getTrendIcon()}
                <span className="font-medium">
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}