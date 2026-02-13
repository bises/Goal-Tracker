import { cn } from '@/lib/utils';
import * as React from 'react';

export interface SquircleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow';
}

const SquircleCard = React.forwardRef<HTMLDivElement, SquircleCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('squircle-card', variant === 'glow' && 'glow-gradient', className)}
        {...props}
      />
    );
  }
);
SquircleCard.displayName = 'SquircleCard';

const SquircleCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props} />
  )
);
SquircleCardHeader.displayName = 'SquircleCardHeader';

const SquircleCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-bold font-display', className)}
    style={{ color: 'var(--deep-charcoal)' }}
    {...props}
  />
));
SquircleCardTitle.displayName = 'SquircleCardTitle';

const SquircleCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm', className)}
    style={{ color: 'var(--warm-gray)' }}
    {...props}
  />
));
SquircleCardDescription.displayName = 'SquircleCardDescription';

const SquircleCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />
);
SquircleCardContent.displayName = 'SquircleCardContent';

const SquircleCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center', className)} {...props} />
  )
);
SquircleCardFooter.displayName = 'SquircleCardFooter';

export {
  SquircleCard,
  SquircleCardContent,
  SquircleCardDescription,
  SquircleCardFooter,
  SquircleCardHeader,
  SquircleCardTitle,
};
