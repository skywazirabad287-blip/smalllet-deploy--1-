"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Search, Upload, File, Image, FileCheck } from "lucide-react";

const documentTypes = [
  { type: "LEASE", label: "Lease", icon: FileCheck, color: "bg-blue-100 text-blue-700" },
  { type: "APPLICATION", label: "Application", icon: FileText, color: "bg-green-100 text-green-700" },
  { type: "ID_DOCUMENT", label: "ID", icon: File, color: "bg-amber-100 text-amber-700" },
  { type: "INSURANCE", label: "Insurance", icon: FileCheck, color: "bg-purple-100 text-purple-700" },
  { type: "RECEIPT", label: "Receipt", icon: FileText, color: "bg-emerald-100 text-emerald-700" },
  { type: "PHOTO", label: "Photo", icon: Image, color: "bg-pink-100 text-pink-700" },
  { type: "OTHER", label: "Other", icon: File, color: "bg-gray-100 text-gray-700" },
];

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [isLoading] = useState(false);

  // Demo documents
  const documents = [
    { id: "1", name: "Sunset Apartments Lease - Unit A", type: "LEASE", property: "Sunset Apartments", tenant: "Sarah Johnson", date: "2024-01-01", size: "2.4 MB" },
    { id: "2", name: "Oakwood House Lease", type: "LEASE", property: "Oakwood House", tenant: "Maria Garcia", date: "2024-02-15", size: "1.8 MB" },
    { id: "3", name: "Sarah Johnson ID - Passport", type: "ID_DOCUMENT", property: "Sunset Apartments", tenant: "Sarah Johnson", date: "2024-01-01", size: "1.2 MB" },
    { id: "4", name: "Property Insurance 2024", type: "INSURANCE", property: "Sunset Apartments", tenant: null, date: "2024-01-01", size: "3.1 MB" },
    { id: "5", name: "Maintenance Receipt - Plumbing", type: "RECEIPT", property: "Sunset Apartments", tenant: null, date: "2024-05-10", size: "0.8 MB" },
    { id: "6", name: "Unit B Move-in Photos", type: "PHOTO", property: "Sunset Apartments", tenant: "David Chen", date: "2024-03-01", size: "5.6 MB" },
  ];

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Securely store and manage all your property documents
          </p>
        </div>
        <Button asChild>
          <Link href="/documents/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents by name or type..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredDocs.map((doc) => {
          const typeInfo = documentTypes.find((t) => t.type === doc.type) || documentTypes[6];
          const Icon = typeInfo.icon;
          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <Badge variant="secondary" className="text-xs">{typeInfo.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doc.property}
                      {doc.tenant && ` · ${doc.tenant}`}
                      {` · ${doc.date} · ${doc.size}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">Download</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your first document to get started
            </p>
            <Button className="mt-4" asChild>
              <Link href="/documents/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
