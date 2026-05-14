"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Building2,
  Home,
  MapPin,
  Trash2,
  Eye,
  Users,
  DollarSign,
} from "lucide-react";

export default function AdminPropertiesPage() {
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-properties", search],
    queryFn: () => api.get(`/properties?search=${encodeURIComponent(search)}&includeUnits=true`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted", description: "Property removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const properties = data?.properties || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage all properties on the platform</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="pl-10 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property: any) => {
          const occupiedUnits = property.units?.filter((u: any) => u.status === "OCCUPIED").length || 0;
          const totalUnits = property.units?.length || 0;
          return (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.address}, {property.city}
                    </CardDescription>
                  </div>
                  <Badge variant={property.status === "ACTIVE" ? "default" : "secondary"}>
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Home className="h-4 w-4" />
                    {totalUnits} units
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {occupiedUnits} occupied
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Owner: {property.landlord?.name || property.landlord?.email || "Unknown"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Dialog open={viewOpen && selectedProperty?.id === property.id} onOpenChange={setViewOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedProperty(property)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{property.name}</DialogTitle>
                          <DialogDescription>{property.address}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Type</p>
                              <p className="text-sm text-muted-foreground">{property.type}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <p className="text-sm text-muted-foreground">{property.status}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">City</p>
                              <p className="text-sm text-muted-foreground">{property.city}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">State</p>
                              <p className="text-sm text-muted-foreground">{property.state}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Units</p>
                            <div className="space-y-2">
                              {property.units?.map((unit: any) => (
                                <div key={unit.id} className="flex items-center justify-between p-2 rounded border">
                                  <span className="text-sm">Unit {unit.unitNumber}</span>
                                  <Badge variant={unit.status === "OCCUPIED" ? "default" : "secondary"}>
                                    {unit.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="destructive" onClick={() => deleteMutation.mutate(property.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Property
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(property.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
