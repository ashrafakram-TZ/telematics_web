import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SHORTCUT_GROUPS, SHORTCUTS, type ShortcutId } from '@/config/shortcuts'
import { Kbd } from './kbd'
import { useShortcutHelp } from './shortcut-context'

const entries = Object.entries(SHORTCUTS) as [ShortcutId, (typeof SHORTCUTS)[ShortcutId]][]

export function ShortcutHelpDialog() {
  const { helpOpen, setHelpOpen } = useShortcutHelp()

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Letter shortcuts are paused while you type in a field. Press Esc to close any dialog.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-6 sm:grid-cols-2'>
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group} className='grid content-start gap-2'>
              <h4 className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                {group}
              </h4>
              <ul className='grid gap-1.5'>
                {entries
                  .filter(([, shortcut]) => shortcut.group === group)
                  .map(([id, shortcut]) => (
                    <li key={id} className='flex items-center justify-between gap-3 text-sm'>
                      <span>{shortcut.label}</span>
                      <Kbd id={id} className='inline-flex' />
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
