import * as React from 'react'
import { cn } from '@/lib/utils'

export function Page({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      id='content'
      className={cn(
        'mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    />
  )
}

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className='grid min-w-0 gap-1'>
        {eyebrow && (
          <div className='text-[11px] font-bold tracking-[0.14em] text-primary uppercase'>
            {eyebrow}
          </div>
        )}
        <h1 className='text-2xl font-extrabold tracking-tight text-balance'>{title}</h1>
        {description && <p className='max-w-2xl text-sm text-muted-foreground'>{description}</p>}
      </div>
      {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
    </div>
  )
}
