import logo from '@/assets/tz-logo.svg?raw'
import { cn } from '@/lib/utils'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      role='img'
      aria-label='Tamilzorous'
      className={cn('inline-flex [&_svg]:h-full [&_svg]:w-auto', className)}
      dangerouslySetInnerHTML={{ __html: logo }}
    />
  )
}

export function BrandMark({ className }: { className?: string }) {
  return <img src='/tz-mark.svg' alt='Tamilzorous' className={cn('h-7 w-auto', className)} />
}
