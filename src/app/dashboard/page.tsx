"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, calculateDaysOverdue } from "@/lib/utils";
import {
  Building2,
  Users,
  Wrench,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  CreditCard,
  FileText,
  Bell,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  href,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  href?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            ) : null}
            <span
              className={`text-xs ${
                trend === "up"
                  ? "text-emerald-500"
                  : trend === "down"
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            >
              {trendValue}
            </span>
          </div>
        )}
        {href && (
          <Button variant="ghost" size="sm" className="mt-2 h-auto p-0 text-xs" asChild>
            <Link href={href}>View details →</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

   const stats = (data as any)?.stats;
  const revenueChartData = (data as any)?.revenueChartData || [];
  const overdueCharges = (data as any)?.overdueCharges || [];
  const recentActivity = (data as any)?.recentActivity || [];
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your properties today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/properties/new">
              <Building2 className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/tenants/new">
              <Users className="mr-2 h-4 w-4" />
              Add Tenant
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.thisMonthRevenue || 0)}
          description="This month"
          icon={DollarSign}
          trend={stats?.revenueChange && stats.revenueChange >= 0 ? "up" : "down"}
          trendValue={`${stats?.revenueChange || 0}% vs last month`}
          href="/accounting"
        />
        <StatCard
          title="Net Income"
          value={formatCurrency(stats?.netIncome || 0)}
          description={`${formatCurrency(stats?.totalExpenses || 0)} in expenses`}
          icon={TrendingUp}
          href="/accounting"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats?.occupancyRate || 0}%`}
          description={`${stats?.occupiedUnits || 0} of ${stats?.totalUnits || 0} units occupied`}
          icon={Home}
          href="/properties"
        />
        <StatCard
          title="Overdue Rent"
          value={formatCurrency(stats?.totalOverdue || 0)}
          description={`${overdueCharges.length} outstanding charges`}
          icon={AlertTriangle}
          trend="down"
          trendValue="Action needed"
          href="/accounting/overdue"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
            <Progress
              value={stats?.occupancyRate || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingMaintenance || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiring Leases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiringLeases || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Rent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Rent
            </CardTitle>
            <CardDescription>
              Charges that are past their due date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueCharges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No overdue charges. Great job!
              </p>
            ) : (
              overdueCharges.slice(0, 5).map((charge: any) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {charge.lease.tenant.firstName} {charge.lease.tenant.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {charge.lease.unit.property.name} — Unit {charge.lease.unit.unitNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(charge.dueDate)} ·{" "}
                      {calculateDaysOverdue(charge.dueDate)} days overdue
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">
                      {formatCurrency(
                        parseFloat(charge.amount) +
                          parseFloat(charge.lateFeeAmount) -
                          parseFloat(charge.paidAmount)
                      )}
                    </p>
                    <Badge variant="destructive" className="mt-1">
                      {charge.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            {overdueCharges.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/accounting/overdue">View all overdue charges</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions across your properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                >
                  <div className="mt-0.5">
                    {activity.action.includes("PAYMENT") ? (
                      <CreditCard className="h-4 w-4 text-emerald-500" />
                    ) : activity.action.includes("MAINTENANCE") ? (
                      <Wrench className="h-4 w-4 text-amber-500" />
                    ) : activity.action.includes("LEASE") ? (
                      <FileText className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">
                      {activity.action.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.property?.name}
                      {activity.tenant && ` · ${activity.tenant.firstName} ${activity.tenant.lastName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
