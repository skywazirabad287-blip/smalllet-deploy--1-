"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Shield,
  User,
  Mail,
  Building2,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, page],
    queryFn: () => api.get(`/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=20`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, action, role }: any) =>
      api.patch("/admin/users", { userId, action, role }),
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user" });
    },
  });

  const handleAction = (userId: string, action: string, role?: string) => {
    updateMutation.mutate({ userId, action, role });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name || "Unnamed"}</p>
                      <Badge variant={user.isDeleted ? "destructive" : user.subscriptionStatus === "ACTIVE" ? "default" : "secondary"}>
                        {user.isDeleted ? "Deleted" : user.subscriptionStatus}
                      </Badge>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {user._count.properties} properties
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {user.subscriptionTier || "FREE"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {formatDate(user.createdAt)}
                      {user.deletedAt && ` · Deleted ${formatDate(user.deletedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedUser(null); }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage User</DialogTitle>
                        <DialogDescription>
                          {user.name || user.email}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Role</label>
                          <Select
                            defaultValue={user.role}
                            onValueChange={(role) => handleAction(user.id, "change_role", role)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LANDLORD">Landlord</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                              <SelectItem value="TENANT">Tenant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        {user.isDeleted ? (
                          <Button variant="outline" onClick={() => handleAction(user.id, "restore")}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore Account
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" onClick={() => handleAction(user.id, "suspend")}>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Suspend
                            </Button>
                            <Button variant="destructive" onClick={() => handleAction(user.id, "force_delete")}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
                            </Button>
                          </>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
