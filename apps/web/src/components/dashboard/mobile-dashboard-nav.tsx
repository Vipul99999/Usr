'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  FileText,
  House,
  KeyRound,
  Link2,
  Shield,
  Settings,
  Users
} from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Home', icon: House },
  { href: '/dashboard/links', label: 'Links', icon: Link2 },
  { href: '/dashboard/analytics', label: 'Stats', icon: BarChart3 },
  { href: '/dashboard/members', label: 'Team', icon: Users },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
  { href: '/dashboard/api-keys', label: 'Keys', icon: KeyRound },
  { href: '/dashboard/exports', label: 'Files', icon: FileText },
  { href: '/dashboard/settings', label: 'Prefs', icon: Settings }
]

export function MobileDashboardNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[rgba(5,11,20,0.9)] backdrop-blur-xl lg:hidden">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3">
        {items.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href === '/dashboard/links' && pathname.startsWith('/dashboard/links/'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[86px] shrink-0 flex-col items-center justify-center gap-1 rounded-[20px] border px-3 py-3 text-[11px] transition ${
                active
                  ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-100 shadow-[0_10px_24px_rgba(52,214,232,0.14)]'
                  : 'border-white/10 bg-white/[0.035] text-white/55'
              }`}
            >
              <Icon size={16} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
