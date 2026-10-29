import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-muted text-muted-foreground',
        success: 'border-success/25 bg-success/10 text-success',
        warning: 'border-warning/25 bg-warning/10 text-warning',
        danger: 'border-destructive/25 bg-destructive/10 text-destructive',
        info: 'border-info/25 bg-info/10 text-info',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

interface BadgeProps extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  dot?: boolean
  pulse?: boolean
}

export function Badge({ className, tone, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && (
        <span className='relative flex size-1.5'>
          {pulse && (
            <span className='absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60' />
          )}
          <span className='relative inline-flex size-1.5 rounded-full bg-current' />
        </span>
      )}
      {children}
    </span>
  )
}
