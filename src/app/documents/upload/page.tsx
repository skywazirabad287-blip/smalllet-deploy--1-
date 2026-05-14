"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

export default function UploadDocumentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    toast({ title: "Document uploaded", description: "Your document has been uploaded successfully." });
    router.push("/documents");
    setIsLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/documents"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-muted-foreground">Upload a new document to your vault</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input id="name" name="name" placeholder="e.g., Lease Agreement - Unit A" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select name="type" defaultValue="OTHER">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEASE">Lease</SelectItem>
                  <SelectItem value="APPLICATION">Application</SelectItem>
                  <SelectItem value="ID_DOCUMENT">ID Document</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="RECEIPT">Receipt</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="PHOTO">Photo</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
              <p className="text-xs text-muted-foreground">Accepted: PDF, JPG, PNG (max 16MB)</p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? "Uploading..." : "Upload"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/documents">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
