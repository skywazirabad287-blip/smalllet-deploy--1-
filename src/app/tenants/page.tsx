"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Users, Plus, Mail, Phone, Home, CreditCard, Search } from "lucide-react";
import { useState } from "react";

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["tenants", search],
    queryFn: () => api.get(`/tenants?search=${encodeURIComponent(search)}`),
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

  const tenants = data?.tenants || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your tenants and their leases
          </p>
        </div>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tenants by name or email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {tenants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tenants yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add your first tenant to get started
            </p>
            <Button asChild>
              <Link href="/tenants/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant: any) => {
            const activeLease = tenant.leases?.[0];
            return (
              <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {tenant.firstName} {tenant.lastName}
                          </h3>
                          {activeLease && (
                            <Badge variant="default">Active Lease</Badge>
                          )}
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
                              {activeLease.unit.property.name} — Unit {activeLease.unit.unitNumber}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <CreditCard className="h-3 w-3" />
                              {formatCurrency(activeLease.rentAmount)}/month
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {activeLease && (
                          <p className="text-sm text-muted-foreground">
                            Until {formatDate(activeLease.endDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
