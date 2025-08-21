
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-6 w-32" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
    
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4 flex-1">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const BudgetsSkeleton = () => (
  <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-4 pb-4 border-b">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 py-3">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ClientsSkeleton = () => (
  <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
    
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4 pb-4 border-b">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface LoadingCardProps {
  className?: string;
}

export const LoadingCard = ({ className }: LoadingCardProps) => (
  <div className={cn("bg-white rounded-lg border p-6 space-y-4", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-16" />
  </div>
);
