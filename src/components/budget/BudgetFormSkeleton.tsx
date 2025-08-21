
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const BudgetFormSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Step Indicator Skeleton */}
      <div className="flex items-center justify-between py-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
            {step < 4 && <Skeleton className="h-0.5 flex-1 mx-2" />}
          </div>
        ))}
      </div>

      {/* Form Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form Fields */}
          {[1, 2, 3].map((field) => (
            <div key={field} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const BudgetCardSkeleton = () => {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        
        <div className="flex gap-2">
          {[1, 2, 3].map((btn) => (
            <Skeleton key={btn} className="h-8 flex-1" />
          ))}
        </div>
      </div>
    </Card>
  );
};
