/**
 * Modern Cards - OneDrip Design System
 * Cards modernos com glassmorphism e microinterações
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ScaleOnHover } from './animations';
import { Heading, Text } from './typography';

// Card base com glassmorphism
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'premium' | 'gradient';
    hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    variant = 'default',
    hover = true,
    className,
    ...props
}) => {
    const variantClasses = {
        default: 'bg-background/80 backdrop-blur-sm border border-border/50',
        premium: 'bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/30 shadow-xl',
        gradient: 'bg-gradient-to-br from-primary/5 via-background/90 to-secondary/5 backdrop-blur-lg border border-primary/20'
    };

    const hoverClasses = hover
        ? 'hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300'
        : '';

    return (
        <div
            className={cn(
                'rounded-2xl p-6',
                variantClasses[variant],
                hoverClasses,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// Card de métrica/estatística
interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
    className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = 'blue',
    className
}) => {
    const colorClasses = {
        blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600',
        green: 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-600',
        yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-600',
        red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-600',
        purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-600',
        indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-600'
    };

    return (
        <ScaleOnHover>
            <GlassCard variant="premium" className={cn('group', className)}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <Text size="sm" color="secondary" className="mb-2">
                            {title}
                        </Text>
                        <Heading level="h3" size="3xl" weight="bold" className="mb-1">
                            {value}
                        </Heading>
                        {subtitle && (
                            <Text size="sm" color="muted">
                                {subtitle}
                            </Text>
                        )}
                        {trend && (
                            <div className="flex items-center mt-2">
                                <div className={cn(
                                    'flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                    trend.isPositive
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                )}>
                                    {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                                </div>
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br border group-hover:scale-110 transition-transform duration-300',
                            colorClasses[color]
                        )}>
                            <Icon className="h-6 w-6" />
                        </div>
                    )}
                </div>
            </GlassCard>
        </ScaleOnHover>
    );
};

// Card de ação rápida
interface ActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
    badge?: string;
    className?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
    title,
    description,
    icon: Icon,
    onClick,
    color = 'blue',
    badge,
    className
}) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
        red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'relative w-full p-6 rounded-2xl text-left',
                'bg-gradient-to-br text-white shadow-lg',
                'hover:shadow-xl transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                colorClasses[color],
                className
            )}
        >
            {badge && (
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                    {badge}
                </div>
            )}

            <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <Heading level="h4" size="lg" weight="semibold" className="text-white mb-2">
                        {title}
                    </Heading>
                    <Text className="text-white/80">
                        {description}
                    </Text>
                </div>
            </div>
        </motion.button>
    );
};

// Card de lista com itens
interface ListCardProps {
    title: string;
    items: Array<{
        id: string;
        title: string;
        subtitle?: string;
        value?: string;
        status?: 'success' | 'warning' | 'error' | 'info';
    }>;
    onItemClick?: (id: string) => void;
    emptyMessage?: string;
    className?: string;
}

export const ListCard: React.FC<ListCardProps> = ({
    title,
    items,
    onItemClick,
    emptyMessage = "Nenhum item encontrado",
    className
}) => {
    const statusColors = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };

    return (
        <GlassCard variant="premium" className={className}>
            <div className="mb-6">
                <Heading level="h3" size="xl" weight="semibold">
                    {title}
                </Heading>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8">
                    <Text color="muted">{emptyMessage}</Text>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            onClick={() => onItemClick?.(item.id)}
                            className={cn(
                                'flex items-center justify-between p-3 rounded-lg',
                                'bg-muted/30 hover:bg-muted/50 transition-colors duration-200',
                                onItemClick && 'cursor-pointer hover:scale-[1.02]'
                            )}
                            whileHover={onItemClick ? { x: 4 } : {}}
                        >
                            <div className="flex-1">
                                <Text weight="medium" className="mb-1">
                                    {item.title}
                                </Text>
                                {item.subtitle && (
                                    <Text size="sm" color="secondary">
                                        {item.subtitle}
                                    </Text>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                {item.value && (
                                    <Text weight="semibold">
                                        {item.value}
                                    </Text>
                                )}
                                {item.status && (
                                    <div className={cn(
                                        'px-2 py-1 rounded-full text-xs font-medium',
                                        statusColors[item.status]
                                    )}>
                                        {item.status}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </GlassCard>
    );
};

// Card de progresso
interface ProgressCardProps {
    title: string;
    current: number;
    total: number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
    className?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
    title,
    current,
    total,
    subtitle,
    color = 'blue',
    className
}) => {
    const percentage = Math.round((current / total) * 100);

    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
        indigo: 'bg-indigo-500'
    };

    return (
        <GlassCard variant="premium" className={className}>
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <Heading level="h4" size="lg" weight="semibold">
                        {title}
                    </Heading>
                    <Text weight="bold" className="text-2xl">
                        {percentage}%
                    </Text>
                </div>
                {subtitle && (
                    <Text size="sm" color="secondary">
                        {subtitle}
                    </Text>
                )}
            </div>

            <div className="mb-4">
                <div className="w-full bg-muted rounded-full h-3">
                    <motion.div
                        className={cn('h-3 rounded-full', colorClasses[color])}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
            </div>

            <div className="flex justify-between text-sm">
                <Text color="secondary">
                    {current} de {total}
                </Text>
                <Text color="secondary">
                    {total - current} restantes
                </Text>
            </div>
        </GlassCard>
    );
};