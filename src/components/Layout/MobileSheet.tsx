import { useEffect, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import { useAppStore } from '../../store/appStore'

interface MobileSheetProps {
  children: ReactNode
  open: boolean
}

export function MobileSheet({ children, open }: MobileSheetProps) {
  const setSelectedAreaId = useAppStore((s) => s.setSelectedAreaId)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setSelectedAreaId(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, setSelectedAreaId])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-20 bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setSelectedAreaId(null)}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={clsx(
          'fixed inset-x-0 bottom-0 z-30 max-h-[85vh] transform rounded-t-2xl bg-bg-secondary transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Area details"
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <button
            className="h-1.5 w-12 rounded-full bg-text-secondary/30 hover:bg-text-secondary/50 transition-colors"
            onClick={() => setSelectedAreaId(null)}
            aria-label="Close sheet"
          />
        </div>

        {/* Content */}
        <div className="max-h-[calc(85vh-3rem)] overflow-y-auto px-4 pb-8">{children}</div>
      </div>
    </>
  )
}

