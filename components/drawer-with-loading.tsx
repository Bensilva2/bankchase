'use client'

import { Drawer } from '@/components/ui/drawer'
import { ReactNode, useState, useEffect } from 'react'
import { pageLoader } from '@/lib/page-loader'

interface DrawerWithLoadingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  description?: string
  className?: string
}

export function DrawerWithLoading({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: DrawerWithLoadingProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (open) {
      setIsReady(false)
      pageLoader.startLoading(30)

      const timer = setTimeout(() => {
        setIsReady(true)
        pageLoader.completeLoading()
      }, 200)

      return () => clearTimeout(timer)
    } else {
      setIsReady(false)
    }
  }, [open])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <div className={className}>
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        
        {!isReady && open ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </Drawer>
  )
}
