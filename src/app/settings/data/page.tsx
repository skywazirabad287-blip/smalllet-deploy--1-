"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Download, Trash2, RotateCcw, FileText, Database, AlertTriangle } from "lucide-react";

export default function DataManagementPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch("/api/data/export");
      const data = await res.json();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smalllet-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `${data.recordCount} records exported successfully.`,
      });
    } catch (error) {
      toast({ title: "Export failed", description: "Please try again later." });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportCSV(type: string) {
    try {
      const res = await fetch(`/api/data/export-csv?type=${type}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smalllet-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "CSV exported", description: `${type} data downloaded.` });
    } catch (error) {
      toast({ title: "Export failed", description: "Please try again later." });
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/data/delete", { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Account scheduled for deletion",
          description: `Your data will be permanently deleted on ${new Date(data.permanentDeletionDate).toLocaleDateString()}.`,
        });
      }
    } catch (error) {
      toast({ title: "Deletion failed", description: "Please try again later." });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleRestore() {
    setIsRestoring(true);
    try {
      const res = await fetch("/api/data/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restoreAll: true }),
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: "Data restored", description: "All your data has been restored successfully." });
      }
    } catch (error) {
      toast({ title: "Restore failed", description: "Please try again later." });
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground">Export, backup, or delete your data</p>
      </div>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a complete copy of all your data (GDPR Article 20)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export includes: properties, units, tenants, leases, payments, maintenance requests,
            expenses, documents, messages, and account settings.
          </p>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export as JSON"}
          </Button>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Export specific data as CSV:</p>
            <div className="flex flex-wrap gap-2">
              {["payments", "expenses", "tenants", "leases"].map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV(type)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Restore Data
          </CardTitle>
          <CardDescription>
            Recover recently deleted data (within 30 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you recently deleted your account or specific data, you can restore it within
            the 30-day retention period.
          </p>
          <Button variant="outline" onClick={handleRestore} disabled={isRestoring}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {isRestoring ? "Restoring..." : "Restore All Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data (GDPR Article 17)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Warning: This action cannot be undone after 30 days</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>All your properties and units will be removed</li>
              <li>All tenant data will be anonymized</li>
              <li>All payment history will be deleted</li>
              <li>All documents will be removed</li>
              <li>Data will be retained for 30 days before permanent deletion</li>
            </ul>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will schedule your account for deletion. You have 30 days to restore it.
                  After that, all data will be permanently deleted and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Deleting..." : "Yes, delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
