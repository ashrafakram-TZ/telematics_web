import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Compass, ServerCrash } from 'lucide-react'
import { BrandMark } from '@/components/common/brand-logo'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api/errors'

function ErrorShell({
  icon: Icon,
  code,
  title,
  description,
  children,
}: {
  icon: typeof Compass
  code: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className='grid min-h-dvh place-items-center bg-background px-4 py-12'>
      <div className='grid max-w-md justify-items-center gap-5 text-center'>
        <BrandMark className='h-9' />
        <span className='grid size-14 place-items-center rounded-full bg-muted text-muted-foreground'>
          <Icon className='size-6' />
        </span>
        <div className='grid gap-2'>
          <span className='font-mono text-sm font-bold text-primary'>{code}</span>
          <h1 className='text-2xl font-extrabold tracking-tight'>{title}</h1>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='flex flex-wrap justify-center gap-2'>{children}</div>
      </div>
    </main>
  )
}

export function NotFoundPage() {
  return (
    <ErrorShell
      icon={Compass}
      code='404'
      title='Page not found'
      description='The page you opened does not exist or has moved.'
    >
      <Button asChild>
        <Link to='/'>Go to dashboard</Link>
      </Button>
    </ErrorShell>
  )
}

export function GeneralErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <ErrorShell
      icon={ServerCrash}
      code='Error'
      title='Something went wrong'
      description={getErrorMessage(error)}
    >
      <Button
        onClick={() => {
          reset()
          router.invalidate()
        }}
      >
        Try again
      </Button>
      <Button asChild variant='outline'>
        <Link to='/'>Go to dashboard</Link>
      </Button>
    </ErrorShell>
  )
}
