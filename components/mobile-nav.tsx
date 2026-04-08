'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Receipt, HardHat, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/projects/new', label: 'New', icon: Plus, special: true },
  { href: '/labour', label: 'Labour', icon: HardHat },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex md:hidden safe-area-pb">
      {nav.map(({ href, label, icon: Icon, special }) => {
        const active = !special && pathname.startsWith(href)
        if (special) {
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center py-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md -mt-4">
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
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
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
