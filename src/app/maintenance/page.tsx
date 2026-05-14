"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Plus, AlertTriangle, Clock, CheckCircle2, Home } from "lucide-react";

const priorityColors: Record<string, string> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
  URGENT: "destructive",
};

const statusColors: Record<string, string> = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "secondary",
  APPROVED: "default",
  IN_PROGRESS: "default",
  WAITING_PARTS: "secondary",
  COMPLETED: "secondary",
  CANCELLED: "secondary",
  REOPENED: "destructive",
};

export default function MaintenancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => api.get("/maintenance"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const requests = Array.isArray(data) ? data : [];
  const activeRequests = requests.filter((r: any) =>
    !["COMPLETED", "CANCELLED"].includes(r.status)
  );
  const completedRequests = requests.filter((r: any) =>
    ["COMPLETED", "CANCELLED"].includes(r.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage maintenance requests across all properties
          </p>
        </div>
        <Button asChild>
          <Link href="/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({requests.length})
          </TabsTrigger>
        </TabsList>

        {["active", "completed", "all"].map((tab) => {
          const tabRequests = tab === "active" ? activeRequests :
            tab === "completed" ? completedRequests : requests;

          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {tabRequests.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No requests</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tab === "active" ? "No active maintenance requests" : "No maintenance requests yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                tabRequests.map((request: any) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{request.title}</h3>
                            <Badge variant={priorityColors[request.priority] as any}>
                              {request.priority}
                            </Badge>
                            <Badge variant={statusColors[request.status] as any}>
                              {request.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {request.unit.property.name} — Unit {request.unit.unitNumber}
                            </span>
                            {request.tenant && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Reported by {request.tenant.firstName} {request.tenant.lastName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(request.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/maintenance/${request.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
