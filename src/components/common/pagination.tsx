import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  label?: string
}

export function Pagination({ page, limit, total, onPageChange, label = 'items' }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground'>
      <span className='tabular'>
        {from}–{to} of {total} {label}
      </span>
      <div className='flex items-center gap-2'>
        <span className='tabular'>
          Page {page} of {pages}
        </span>
        <Button
          variant='outline'
          size='icon-sm'
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label='Previous page'
        >
          <ChevronLeft />
        </Button>
        <Button
          variant='outline'
          size='icon-sm'
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label='Next page'
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
