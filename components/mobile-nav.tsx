'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Clock, Receipt, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/projects/new', label: 'New', icon: Plus, special: true },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {nav.map(({ href, label, icon: Icon, special }) => {
        const active = !special && pathname.startsWith(href)
        if (special) {
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center py-2">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg -mt-6 border-4 border-white">
                <Icon className="h-5 w-5 text-white" />
              </div>
            </Link>
          )
        }
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors',
              active ? 'text-blue-600' : 'text-gray-400'
            )}
          >
            <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-400')} />
            <span className={cn('text-[10px] font-medium leading-none', active ? 'text-blue-600' : 'text-gray-400')}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
