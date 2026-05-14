"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Building2,
  CreditCard,
  Wrench,
  Trash2,
  RotateCcw,
  Shield,
} from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats"),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users"),
  });

  const stats = statsData || {};
  const users = Array.isArray(usersData) ? usersData : [];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and user management</p>
        </div>
        <Button variant="outline" onClick={() => {}}>
          Run Cleanup
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats as any)?.users?.total || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">{(stats as any)?.users?.active || 0} active</Badge>
              <Badge variant="destructive">{(stats as any)?.users?.deleted || 0} deleted</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats as any)?.properties?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats as any)?.properties?.units || 0} units · {(stats as any)?.properties?.tenants || 0} tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats as any)?.revenue?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats as any)?.revenue?.thisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats as any)?.maintenance?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats as any)?.maintenance?.inProgress || 0} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{user.name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={user.role === "LANDLORD" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                    <Badge variant={user.isDeleted ? "destructive" : "outline"}>
                      {user.isDeleted ? "Deleted" : "Active"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserAction(user.id, "suspend")}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserAction(user.id, "restore")}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUserAction(user.id, "delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
