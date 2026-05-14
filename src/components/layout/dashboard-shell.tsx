"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/dashboard/properties", icon: Building2 },
  { name: "Tenants", href: "/dashboard/tenants", icon: Users },
  { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="mb-6 px-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SmallLet</h1>
          </div>
          <ul className="space-y-2 font-medium">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center p-2 rounded-lg group ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/api/auth/signout"
              className="flex items-center p-2 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="p-4 lg:ml-64">
        <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}
