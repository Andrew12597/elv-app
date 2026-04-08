import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content — add bottom padding on mobile for nav bar */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </div>
  )
}
