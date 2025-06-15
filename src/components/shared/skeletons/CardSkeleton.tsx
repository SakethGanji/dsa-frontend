import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  showHeader?: boolean;
  showFooter?: boolean;
  showImage?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showHeader = true,
  showFooter = false,
  showImage = false,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
      )}
      
      <CardContent className={!showHeader ? 'pt-6' : ''}>
        {showImage && (
          <Skeleton className="h-48 w-full mb-4 rounded-md" />
        )}
        
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'h-4',
                i === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      </CardContent>
      
      {showFooter && (
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      )}
    </Card>
  );
}