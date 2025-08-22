
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const BudgetsLoadingState = () => {
  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in pb-24 lg:pb-0">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded-lg w-48 animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="h-5 bg-muted rounded w-64 animate-pulse" />
            <div className="h-6 bg-muted rounded w-12 animate-pulse" />
          </div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 bg-muted rounded-lg w-full animate-pulse" />
      
      {/* Content Skeleton */}
      <Card className="glass-card border-0 shadow-lg bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <CardHeader className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-40 animate-pulse" />
            <div className="h-6 bg-muted rounded w-16 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 lg:pt-0">
          {/* Mobile Cards Skeleton */}
          <div className="block lg:hidden space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-40 bg-muted rounded-2xl animate-pulse"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              />
            ))}
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden lg:block space-y-4">
            <div className="grid grid-cols-6 gap-4 p-4 border-b border-white/10">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-6 gap-4 p-4 border-b border-white/10"
                style={{
                  animationDelay: `${rowIndex * 50}ms`
                }}
              >
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <div key={colIndex} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
