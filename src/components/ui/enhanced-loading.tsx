
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Enhanced skeleton with shimmer effect
export const EnhancedSkeleton = ({ 
  className, 
  variant = 'default',
  ...props 
}: { 
  className?: string; 
  variant?: 'default' | 'rounded' | 'circle' | 'text';
} & React.HTMLAttributes<HTMLDivElement>) => {
  const baseClasses = "animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]";
  
  const variants = {
    default: "rounded-md",
    rounded: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4"
  };

  return (
    <div
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  );
};

// Specific loading components for different sections
export const StatCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <Card 
    className="glass-card border-0 animate-fade-in" 
    style={{ animationDelay: `${delay}ms` }}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <EnhancedSkeleton className="h-4 w-24" variant="text" />
      <EnhancedSkeleton className="h-8 w-8" variant="rounded" />
    </CardHeader>
    <CardContent className="space-y-2">
      <EnhancedSkeleton className="h-8 w-20" variant="text" />
      <EnhancedSkeleton className="h-3 w-16" variant="text" />
    </CardContent>
  </Card>
);

export const BudgetRowSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="flex items-center justify-between p-4 border border-border/50 rounded-xl animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton className="h-4 w-32" variant="text" />
          <EnhancedSkeleton className="h-3 w-24" variant="text" />
        </div>
        <div className="text-right space-y-2">
          <EnhancedSkeleton className="h-4 w-20" variant="text" />
          <EnhancedSkeleton className="h-4 w-16" variant="rounded" />
        </div>
      </div>
    </div>
    <div className="flex space-x-1 ml-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <EnhancedSkeleton key={i} className="h-8 w-8" variant="rounded" />
      ))}
    </div>
  </div>
);

export const TableRowSkeleton = ({ columns = 5, delay = 0 }: { columns?: number; delay?: number }) => (
  <tr 
    className="border-b border-border/30 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <EnhancedSkeleton className="h-4 w-full" variant="text" />
      </td>
    ))}
  </tr>
);

// Enhanced Dashboard Skeleton with staggered animations
export const EnhancedDashboardSkeleton = () => (
  <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
    {/* Header */}
    <div className="space-y-2 animate-fade-in">
      <EnhancedSkeleton className="h-8 w-48" variant="text" />
      <EnhancedSkeleton className="h-4 w-64" variant="text" />
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} delay={i * 100} />
      ))}
    </div>
    
    {/* Recent Budgets */}
    <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
      <CardHeader>
        <EnhancedSkeleton className="h-6 w-40" variant="text" />
        <EnhancedSkeleton className="h-4 w-32" variant="text" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <BudgetRowSkeleton key={i} delay={500 + (i * 50)} />
        ))}
      </CardContent>
    </Card>
  </div>
);

// Enhanced Budgets Skeleton
export const EnhancedBudgetsSkeleton = () => (
  <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
      <div className="space-y-2">
        <EnhancedSkeleton className="h-8 w-32" variant="text" />
        <EnhancedSkeleton className="h-4 w-48" variant="text" />
      </div>
      <div className="flex items-center space-x-3">
        <EnhancedSkeleton className="h-10 w-24" variant="rounded" />
        <EnhancedSkeleton className="h-10 w-20" variant="rounded" />
      </div>
    </div>

    {/* Search Bar */}
    <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: '100ms' }}>
      <CardContent className="p-4">
        <EnhancedSkeleton className="h-10 w-full" variant="rounded" />
      </CardContent>
    </Card>
    
    {/* Table */}
    <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: '200ms' }}>
      <CardHeader>
        <EnhancedSkeleton className="h-6 w-36" variant="text" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {['Dispositivo', 'Problema', 'Valor', 'Data', 'Ações'].map((_, i) => (
                  <th key={i} className="p-4 text-left">
                    <EnhancedSkeleton className="h-4 w-20" variant="text" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRowSkeleton key={i} delay={300 + (i * 50)} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);
