"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Mail,
  CreditCard,
  Globe,
  Save,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    newUserApproval: false,
    emailNotifications: true,
    autoBackup: true,
    stripeLiveMode: false,
    defaultCurrency: "USD",
    defaultTimezone: "America/New_York",
    maxFileSize: "16",
    sessionTimeout: "30",
  });

  async function handleSave() {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: "Settings saved", description: "Platform settings updated successfully" });
    setIsLoading(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global platform settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Security and access control settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Block all non-admin access</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New User Approval</Label>
              <p className="text-sm text-muted-foreground">Require admin approval for new accounts</p>
            </div>
            <Switch
              checked={settings.newUserApproval}
              onCheckedChange={(v) => setSettings({ ...settings, newUserApproval: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout (days)</Label>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send email alerts for critical events</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>From Email</Label>
            <Input placeholder="noreply@smalllet.app" defaultValue="noreply@smalllet.app" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Stripe Live Mode</Label>
              <p className="text-sm text-muted-foreground">Use live Stripe keys for real payments</p>
            </div>
            <Switch
              checked={settings.stripeLiveMode}
              onCheckedChange={(v) => setSettings({ ...settings, stripeLiveMode: v })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Input value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage & Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Backup</Label>
              <p className="text-sm text-muted-foreground">Daily automated database backups</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(v) => setSettings({ ...settings, autoBackup: v })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Max File Upload Size (MB)</Label>
            <Input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Timezone</Label>
            <Input value={settings.defaultTimezone} onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSave} disabled={isLoading}>
        <Save className="mr-2 h-4 w-4" />
        {isLoading ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
