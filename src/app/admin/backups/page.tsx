"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
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
import { toast } from "@/hooks/use-toast";
import { Database, Download, RotateCcw, Trash2, HardDrive, Calendar, FileArchive } from "lucide-react";

export default function AdminBackupsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-backups"],
    queryFn: () => api.get("/admin/backup"),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/admin/backup", { compress: true }),
    onSuccess: (data) => {
   const backupData = data as any;
toast({ title: "Backup created", description: `Size: ${(backupData.size / 1024 / 1024).toFixed(2)} MB` });
      queryClient.invalidateQueries({ queryKey: ["admin-backups"] });
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create backup" });
      setIsCreating(false);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (filePath: string) => api.put("/admin/backup", { filePath }),
    onSuccess: () => {
      toast({ title: "Restored", description: "Database restored successfully" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const backups = data?.backups || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backups</h1>
          <p className="text-muted-foreground">Manage database backups and recovery</p>
        </div>
        <Button onClick={() => { setIsCreating(true); createMutation.mutate(); }} disabled={isCreating}>
          <Database className="mr-2 h-4 w-4" />
          {isCreating ? "Creating..." : "Create Backup"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(backups.reduce((sum: number, b: any) => sum + b.size, 0) / 1024 / 1024).toFixed(1)} MB
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups[0] ? formatDate(backups[0].createdAt) : "None"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
          <CardDescription>Click restore to rollback database to a previous state</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {backups.map((backup: any) => (
              <div key={backup.filename} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileArchive className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{backup.filename}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {(backup.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(backup.createdAt)}
                      </span>
                      {backup.compressed && <Badge variant="secondary">Compressed</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(backup.path)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
            {backups.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4" />
                <p>No backups available</p>
                <p className="text-sm">Create your first backup to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
