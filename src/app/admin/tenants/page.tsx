"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
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
import { toast } from "@/hooks/use-toast";
import { Search, Users, Mail, Phone, Home, CreditCard, Trash2, Eye } from "lucide-react";

export default function AdminTenantsPage() {
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenants", search],
    queryFn: () => api.get(`/tenants?search=${encodeURIComponent(search)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted", description: "Tenant removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
  });

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

  const tenants = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Manage all tenants on the platform</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            className="pl-10 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {tenants.map((tenant: any) => {
          const activeLease = tenant.leases?.[0];
          return (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{tenant.firstName} {tenant.lastName}</h3>
                      {activeLease && <Badge variant="default">Active Lease</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {tenant.email}
                      </span>
                      {tenant.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {tenant.phone}
                        </span>
                      )}
                    </div>
                    {activeLease && (
                      <div className="flex items-center gap-4 text-sm mt-2">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Home className="h-3 w-3" />
                          {activeLease.unit?.property?.name} — Unit {activeLease.unit?.unitNumber}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          {formatCurrency(activeLease.rentAmount)}/month
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={viewOpen && selectedTenant?.id === tenant.id} onOpenChange={setViewOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTenant(tenant)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>{tenant.firstName} {tenant.lastName}</DialogTitle>
                          <DialogDescription>Tenant Details</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm font-medium">Email</p><p className="text-sm text-muted-foreground">{tenant.email}</p></div>
                            <div><p className="text-sm font-medium">Phone</p><p className="text-sm text-muted-foreground">{tenant.phone || "N/A"}</p></div>
                            <div><p className="text-sm font-medium">Credit Score</p><p className="text-sm text-muted-foreground">{tenant.creditScore || "N/A"}</p></div>
                            <div><p className="text-sm font-medium">Emergency Contact</p><p className="text-sm text-muted-foreground">{tenant.emergencyName || "N/A"}</p></div>
                          </div>
                          {tenant.notes && (
                            <div>
                              <p className="text-sm font-medium">Notes</p>
                              <p className="text-sm text-muted-foreground">{tenant.notes}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium mb-2">Leases</p>
                            {tenant.leases?.map((lease: any) => (
                              <div key={lease.id} className="flex items-center justify-between p-2 rounded border">
                                <span className="text-sm">{lease.unit?.property?.name} — Unit {lease.unit?.unitNumber}</span>
                                <Badge variant={lease.status === "ACTIVE" ? "default" : "secondary"}>{lease.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="destructive" onClick={() => deleteMutation.mutate(tenant.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Tenant
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(tenant.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
