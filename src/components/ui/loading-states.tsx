
import React from 'react';
import { cn } from '@/lib/utils';

// Skeleton components for different content types
export const TextSkeleton = ({ className, lines = 3 }: { className?: string; lines?: number }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "h-4 bg-muted rounded animate-pulse",
          i === lines - 1 ? "w-3/4" : "w-full"
        )}
      />
    ))}
  </div>
);

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-lg border bg-card p-6 shadow-sm animate-pulse", className)}>
    <div className="space-y-4">
      <div className="h-6 bg-muted rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4, className }: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) => (
  <div className={cn("w-full", className)}>
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b p-4 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const StatCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-lg border bg-card p-6 shadow-sm animate-pulse", className)}>
    <div className="flex items-center justify-between space-y-0 pb-3">
      <div className="h-4 bg-muted rounded w-24" />
      <div className="h-8 w-8 bg-muted rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-8 bg-muted rounded w-20" />
      <div className="h-3 bg-muted rounded w-16" />
    </div>
  </div>
);

export const FormSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6", className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-10 bg-muted rounded w-full" />
      </div>
    ))}
    <div className="flex justify-end space-x-2">
      <div className="h-10 bg-muted rounded w-20" />
      <div className="h-10 bg-muted rounded w-20" />
    </div>
  </div>
);

// Page-specific skeletons
export const BudgetListSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-4 bg-muted rounded w-64 animate-pulse" />
      </div>
      <div className="h-10 bg-muted rounded w-32 animate-pulse" />
    </div>
    <TableSkeleton rows={8} columns={6} />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="p-8 space-y-8">
    <div className="space-y-2">
      <div className="h-8 bg-muted rounded w-48 animate-pulse" />
      <div className="h-4 bg-muted rounded w-64 animate-pulse" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <CardSkeleton className="h-80" />
      <CardSkeleton className="h-80" />
    </div>
  </div>
);
