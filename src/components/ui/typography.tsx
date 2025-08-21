/**
 * Sistema de Tipografia - OneDrip Design System
 * Componentes tipográficos consistentes e acessíveis
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-tokens';

// Tipos para as variantes
type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
type TextColor = 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive';

// Componente Heading
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  gradient?: boolean;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 'h2',
  size,
  weight = 'bold',
  color = 'primary',
  gradient = false,
  className,
  children,
  ...props
}) => {
  const Component = level;
  
  // Mapeamento padrão de tamanhos por nível
  const defaultSizes: Record<HeadingLevel, TextSize> = {
    h1: '4xl',
    h2: '3xl',
    h3: '2xl',
    h4: 'xl',
    h5: 'lg',
    h6: 'base'
  };

  const finalSize = size || defaultSizes[level];

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const colorClasses = {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-muted-foreground/70',
    accent: 'text-accent-foreground',
    destructive: 'text-destructive'
  };

  const gradientClass = gradient 
    ? 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'
    : '';

  return (
    <Component
      className={cn(
        sizeClasses[finalSize],
        weightClasses[weight],
        gradient ? gradientClass : colorClasses[color],
        'leading-tight tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Componente Text
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  variant?: 'body' | 'caption' | 'overline';
  as?: 'p' | 'span' | 'div';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  size = 'base',
  weight = 'normal',
  color = 'primary',
  variant = 'body',
  as = 'p',
  className,
  children,
  ...props
}) => {
  const Component = as;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const colorClasses = {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-muted-foreground/70',
    accent: 'text-accent-foreground',
    destructive: 'text-destructive'
  };

  const variantClasses = {
    body: 'leading-relaxed',
    caption: 'leading-normal text-sm',
    overline: 'leading-none text-xs uppercase tracking-wider'
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Componente Code
interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'inline' | 'block';
  children: React.ReactNode;
}

export const Code: React.FC<CodeProps> = ({
  variant = 'inline',
  className,
  children,
  ...props
}) => {
  if (variant === 'block') {
    return (
      <pre
        className={cn(
          'bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono',
          'border border-border',
          className
        )}
        {...props}
      >
        <code>{children}</code>
      </pre>
    );
  }

  return (
    <code
      className={cn(
        'bg-muted px-1.5 py-0.5 rounded text-sm font-mono',
        'text-foreground border border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
};

// Componente Link estilizado
interface StyledLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'subtle' | 'accent';
  underline?: 'always' | 'hover' | 'never';
  children: React.ReactNode;
}

export const StyledLink: React.FC<StyledLinkProps> = ({
  variant = 'default',
  underline = 'hover',
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    default: 'text-primary hover:text-primary/80',
    subtle: 'text-muted-foreground hover:text-foreground',
    accent: 'text-accent-foreground hover:text-accent-foreground/80'
  };

  const underlineClasses = {
    always: 'underline',
    hover: 'hover:underline',
    never: 'no-underline'
  };

  return (
    <a
      className={cn(
        'transition-colors duration-200 font-medium',
        variantClasses[variant],
        underlineClasses[underline],
        'focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
};

// Componente Blockquote
interface BlockquoteProps extends React.HTMLAttributes<HTMLQuoteElement> {
  author?: string;
  children: React.ReactNode;
}

export const Blockquote: React.FC<BlockquoteProps> = ({
  author,
  className,
  children,
  ...props
}) => (
  <blockquote
    className={cn(
      'border-l-4 border-primary pl-6 py-2 italic',
      'text-muted-foreground bg-muted/30 rounded-r-lg',
      className
    )}
    {...props}
  >
    <div className="text-foreground">{children}</div>
    {author && (
      <footer className="mt-2 text-sm">
        — <cite className="not-italic font-medium">{author}</cite>
      </footer>
    )}
  </blockquote>
);

// Componente List estilizada
interface ListProps extends React.HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  variant?: 'bullet' | 'number' | 'none';
  spacing?: 'tight' | 'normal' | 'loose';
  children: React.ReactNode;
}

export const List: React.FC<ListProps> = ({
  variant = 'bullet',
  spacing = 'normal',
  className,
  children,
  ...props
}) => {
  const Component = variant === 'number' ? 'ol' : 'ul';
  
  const variantClasses = {
    bullet: 'list-disc list-inside',
    number: 'list-decimal list-inside',
    none: 'list-none'
  };

  const spacingClasses = {
    tight: 'space-y-1',
    normal: 'space-y-2',
    loose: 'space-y-4'
  };

  return (
    <Component
      className={cn(
        variantClasses[variant],
        spacingClasses[spacing],
        'text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Componente Badge tipográfico
interface TypographyBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TypographyBadge: React.FC<TypographyBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className
}) => {
  const variantClasses = {
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-muted text-muted-foreground border-border',
    success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
};