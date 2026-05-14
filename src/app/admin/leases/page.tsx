"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, Home, Users } from "lucide-react";

export default function AdminLeasesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-leases"],
    queryFn: () => api.get("/leases"),
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

  const leases = data?.leases || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leases</h1>
        <p className="text-muted-foreground">Manage all leases on the platform</p>
      </div>

      <div className="space-y-4">
        {leases.map((lease: any) => (
          <Card key={lease.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{lease.tenant?.firstName} {lease.tenant?.lastName}</h3>
                    <Badge variant={lease.status === "ACTIVE" ? "default" : "secondary"}>{lease.status}</Badge>
                    {lease.autoRenew && <Badge variant="outline">Auto Renew</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {lease.unit?.property?.name} — Unit {lease.unit?.unitNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {formatCurrency(lease.rentAmount)}/month
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
