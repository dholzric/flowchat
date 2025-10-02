interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-300';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-3" />
        </div>
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-4" />
      </div>
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div className="space-y-1 animate-pulse">
      <Skeleton className="w-full h-8 bg-gray-700" />
      <Skeleton className="w-full h-8 bg-gray-700" />
      <Skeleton className="w-full h-8 bg-gray-700" />
      <Skeleton className="w-3/4 h-8 bg-gray-700" />
    </div>
  );
}

export function DMListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-8 h-8 bg-gray-700" />
        <Skeleton className="flex-1 h-4 bg-gray-700" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-8 h-8 bg-gray-700" />
        <Skeleton className="flex-1 h-4 bg-gray-700" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-8 h-8 bg-gray-700" />
        <Skeleton className="flex-1 h-4 bg-gray-700" />
      </div>
    </div>
  );
}
