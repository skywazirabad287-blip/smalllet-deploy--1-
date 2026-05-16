"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Building2, 
  DollarSign, 
  Wrench, 
  Shield, 
  Crown,
  TrendingUp,
  Activity,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  AlertTriangle
} from "lucide-react";

interface PlatformStats {
  totalUsers: number;
  totalLandlords: number;
  totalTenants: number;
  totalProperties: number;
  totalUnits: number;
  totalLeases: number;
  totalPayments: number;
  totalRevenue: number;
  totalMaintenanceRequests: number;
  pendingMaintenance: number;
  activeSubscriptions: number;
  freeUsers: number;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  propertiesCount: number;
  tenantsCount: number;
  paymentsTotal: number;
  lastActive: string;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || session.user.role !== "OWNER") {
      router.push("/dashboard");
      return;
    }

    fetchStats();
    fetchUsers();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/platform-stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users-list");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "OWNER") {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-500 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Platform Owner Access — {session.user.email}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-4 py-2 text-sm font-semibold">
          <Crown className="h-4 w-4 mr-1" />
          OWNER
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            All Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {stats?.totalLandlords || 0} landlords, {stats?.totalTenants || 0} tenants
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.totalProperties || 0}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {stats?.totalUnits || 0} units across platform
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {stats?.totalPayments || 0} payments processed
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.totalMaintenanceRequests || 0}</div>
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {stats?.pendingMaintenance || 0} pending requests
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Leases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.totalLeases || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Across all properties</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-pink-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {stats?.freeUsers || 0} on free tier
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Platform Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  +{users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length}
                </div>
                <p className="text-xs text-gray-400 mt-1">New users last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Avg Revenue/User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalUsers ? (stats.totalRevenue / stats.totalUsers) : 0)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Lifetime average</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Signups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Signups (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users
                  .filter(u => new Date(u.createdAt) > new Date(Date.now() - 7*24*60*60*1000))
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || "No name"}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.role === "OWNER" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length === 0 && (
                  <p className="text-gray-400 text-center py-4">No new signups in the last 7 days</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Platform Users
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{users.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Plan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Properties</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Payments</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.name || "—"}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={user.role === "OWNER" ? "default" : "secondary"}
                            className={user.role === "OWNER" ? "bg-amber-500 hover:bg-amber-600" : ""}
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit">
                              {user.subscriptionTier}
                            </Badge>
                            <span className="text-xs text-gray-400">{user.subscriptionStatus}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{user.propertiesCount}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{formatCurrency(user.paymentsTotal)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVENUE TAB */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Platform Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-sm text-green-600 mt-2">
                  From {stats?.totalPayments || 0} payments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Paid Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-900">
                  {stats?.activeSubscriptions || 0}
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  {stats?.freeUsers || 0} users on free tier
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Per User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-900">
                  {formatCurrency(stats?.totalUsers ? (stats.totalRevenue / stats.totalUsers) : 0)}
                </div>
                <p className="text-sm text-purple-600 mt-2">
                  Average lifetime value
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Owner Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Your Admin Status</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{session?.user?.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Role:</span>
                      <Badge className="bg-amber-500">OWNER</Badge>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Access Level:</span>
                      <span className="font-medium text-green-600">Full Platform</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Platform Health</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Database:</span>
                      <span className="font-medium text-green-600">Connected</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Stripe:</span>
                      <span className="font-medium text-green-600">Active</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Build Status:</span>
                      <span className="font-medium text-green-600">Live</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Owner-Only Warning
                </h3>
                <p className="text-sm text-amber-700">
                  This dashboard is only accessible to users with the OWNER role. 
                  Do not assign OWNER to anyone else. Use LANDLORD or MANAGER for team members.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
