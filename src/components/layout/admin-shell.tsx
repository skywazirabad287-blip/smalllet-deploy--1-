"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Wrench,
  DollarSign,
  FileText,
  Settings,
  Shield,
  Database,
  BarChart3,
  Menu,
  LogOut,
  ChevronRight,
  Home,
  Bell,
  MessageSquare,
  Receipt,
} from "lucide-react";

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Properties", href: "/admin/properties", icon: Building2 },
  { title: "Tenants", href: "/admin/tenants", icon: Users },
  { title: "Leases", href: "/admin/leases", icon: FileText },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  { title: "Expenses", href: "/admin/expenses", icon: DollarSign },
  { title: "Documents", href: "/admin/documents", icon: FileText },
  { title: "Messages", href: "/admin/messages", icon: MessageSquare },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Backups", href: "/admin/backups", icon: Database },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      <div className="flex items-center gap-2 px-4 py-6 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">SmallLet</span>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.title}
              {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs text-muted-foreground">Theme</span>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col">
        <AdminSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4 lg:px-8">
            <div className="lg:hidden w-10" />
            <div className="flex items-center gap-4 ml-auto">
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
