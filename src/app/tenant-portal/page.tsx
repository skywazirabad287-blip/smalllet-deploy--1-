"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Wrench, FileText, CreditCard, Home, Bell } from "lucide-react";
import Link from "next/link";

export default function TenantPortalPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">SmallLet Tenant Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <span className="text-sm">{session?.user?.name || "Tenant"}</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your rental</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,200.00</div>
              <p className="text-xs text-muted-foreground">Due May 5, 2024</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lease Ends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Dec 31, 2024</div>
              <p className="text-xs text-muted-foreground">235 days remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Property</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Unit A</div>
              <p className="text-xs text-muted-foreground">Sunset Apartments</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pay Rent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">May 2024 Rent</p>
                  <p className="text-sm text-muted-foreground">Due May 5, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">$1,200.00</p>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </div>
              <Button className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div>
                  <p className="font-medium">Leaky faucet in kitchen</p>
                  <p className="text-sm text-muted-foreground">Submitted May 1, 2024</p>
                </div>
                <Badge>In Progress</Badge>
              </div>
              <Button variant="outline" className="w-full">
                <Wrench className="mr-2 h-4 w-4" />
                Submit New Request
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
