"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { toast } from "@/hooks/use-toast";
import { Search, CreditCard, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", search, status],
    queryFn: () => api.get(`/payments?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/payments/${id}`, { status: "REFUNDED" }),
    onSuccess: () => {
      toast({ title: "Refunded", description: "Payment has been refunded" });
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

const payments = Array.isArray(data) ? data : [];
  const totalAmount = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage all payments on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.filter((p: any) => p.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {payments.filter((p: any) => p.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {payments.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{payment.tenant?.firstName} {payment.tenant?.lastName}</p>
                    <Badge variant={
                      payment.status === "COMPLETED" ? "default" :
                      payment.status === "PENDING" ? "secondary" :
                      payment.status === "FAILED" ? "destructive" : "outline"
                    }>
                      {payment.status}
                    </Badge>
                    <Badge variant="outline">{payment.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {payment.method}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(payment.createdAt)}
                    </span>
                    {payment.lease?.unit?.property?.name && (
                      <span>{payment.lease.unit.property.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {payment.status === "COMPLETED" && (
                    <Button variant="outline" size="sm" onClick={() => refundMutation.mutate(payment.id)}>
                      Refund
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
