'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Menu,
  BarChart3,
  Zap,
  TrendingUp,
  Cpu,
  Activity,
  Brain,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  color: string
}

const navigationItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: <Home size={20} />,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    label: 'Business Context',
    href: '/business-context',
    icon: <BookOpen size={20} />,
    color: 'from-amber-500 to-orange-600',
  },
  {
    label: 'Analytics Dashboard',
    href: '/analytics',
    icon: <BarChart3 size={20} />,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    label: 'Control Room',
    href: '/control-room',
    icon: <Zap size={20} />,
    color: 'from-purple-500 to-pink-600',
  },
  {
    label: 'Authority Dashboard',
    href: '/authority',
    icon: <TrendingUp size={20} />,
    color: 'from-green-500 to-emerald-600',
  },
  {
    label: 'Command Center',
    href: '/command-center',
    icon: <Cpu size={20} />,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    label: 'Execution Monitor',
    href: '/execution',
    icon: <Activity size={20} />,
    color: 'from-rose-500 to-red-600',
  },
  {
    label: 'Analytics & Planning',
    href: '/analytics-planning',
    icon: <Brain size={20} />,
    color: 'from-yellow-500 to-amber-600',
  },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
      >
        <Menu size={24} className="text-white" />
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 flex flex-col transition-transform duration-300 z-40',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Agent OS
          </h1>
          <p className="text-xs text-slate-400 mt-1">Thought Leadership Engine</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition',
                      pathname === item.href
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'text-slate-300 hover:bg-slate-700/50'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          <p>Version 1.0.0</p>
          <p className="mt-1">Phase 6 (Complete)</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
