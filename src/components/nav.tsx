'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIsAdmin, useUser } from '@/lib/hooks'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '◉' },
  { href: '/assess', label: 'Assessment', icon: '◈' },
  { href: '/okrs', label: 'OKRs', icon: '◎' },
  { href: '/check-in', label: 'Check-in', icon: '◇' },
  { href: '/check-in', label: 'Check-in', icon: '◇' },
  { href: '/kpis', label: 'KPIs', icon: '◆' },
  { href: '/history', label: 'History', icon: '◆' },
]

const adminItems = [
  { href: '/admin', label: 'Admin', icon: '⚙' },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { isAdmin } = useIsAdmin()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const items = isAdmin ? [...navItems, ...adminItems] : navItems

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="text-2xl font-bold text-white tracking-tight">USDM</div>
        <div className="text-xs text-[#64C4DD] tracking-widest uppercase mt-1">Dept Performance</div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
              pathname === item.href
                ? 'bg-[#64C4DD]/20 text-[#64C4DD] border border-[#64C4DD]/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/40 truncate mb-2">{user?.email}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full text-white/60 hover:text-white hover:bg-white/10"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )

  if (pathname === '/login') return null

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#10193C] h-screen fixed left-0 top-0 flex-col z-50">
        <NavContent />
      </aside>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#10193C] flex items-center px-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="text-white p-2 hover:bg-white/10 rounded-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#10193C] border-none">
            <NavContent />
          </SheetContent>
        </Sheet>
        <div className="ml-3">
          <span className="text-white font-bold">USDM</span>
          <span className="text-[#64C4DD] text-xs ml-2">Dept Performance</span>
        </div>
      </header>
    </>
  )
}
