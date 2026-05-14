"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Building2,
  DollarSign,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Shield,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats"),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users"),
  });

  async function handleCleanup() {
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Cleanup completed",
          description: `${data.totalDeleted} records permanently deleted.`,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Cleanup failed" });
    }
  }

  async function handleUserAction(userId: string, action: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: `User ${action}d successfully` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Action failed" });
    }
  }

  if (statsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const users = Array.isArray(usersData) ? usersData : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and user management</p>
        </div>
        <Button variant="outline" onClick={handleCleanup}>
          <Trash2 className="mr-2 h-4 w-4" />
          Run Cleanup
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">{stats?.users?.active || 0} active</Badge>
              <Badge variant="destructive">{stats?.users?.deleted || 0} deleted</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.properties?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.properties?.units || 0} units · {stats?.properties?.tenants || 0} tenants
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.financials?.totalRevenue || 0)}</div>
            <div className="flex items-center gap-1 mt-1">
              {stats?.users?.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {stats?.users?.growthRate || 0}% user growth
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.maintenance?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats?.maintenance?.total || 0} total requests
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <BarChart3 className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="financials">
            <DollarSign className="h-4 w-4 mr-2" />
            Financials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name || "Unnamed"}</p>
                        <Badge variant={user.isDeleted ? "destructive" : "default"}>
                          {user.isDeleted ? "Deleted" : "Active"}
                        </Badge>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user._count.properties} properties · {user._count.teamMembers} team members
                        {user.subscriptionTier && ` · ${user.subscriptionTier}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDate(user.createdAt)}
                        {user.deletedAt && ` · Deleted ${formatDate(user.deletedAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isDeleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, "restore")}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, "suspend")}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUserAction(user.id, "force_delete")}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By Tier</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.subscriptions?.byTier?.map((tier: any) => (
                  <div key={tier.subscriptionTier} className="flex items-center justify-between py-2">
                    <span className="text-sm">{tier.subscriptionTier}</span>
                    <Badge>{tier._count.id} users</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By Status</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.subscriptions?.byStatus?.map((status: any) => (
                  <div key={status.subscriptionStatus} className="flex items-center justify-between py-2">
                    <span className="text-sm">{status.subscriptionStatus}</span>
                    <Badge>{status._count.id} users</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats?.financials?.thisMonthRevenue || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Last Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.financials?.lastMonthRevenue || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.financials?.netIncome || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
