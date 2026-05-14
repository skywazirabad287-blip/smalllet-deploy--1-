"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Mail, Send, Clock } from "lucide-react";

export default function AdminMessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: () => api.get("/messages"),
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

  const messages = data?.messages || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">View all platform messages</p>
      </div>

      <div className="space-y-4">
        {messages.map((msg: any) => (
          <Card key={msg.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{msg.subject || "No Subject"}</h3>
                    <Badge variant="outline">{msg.sentVia}</Badge>
                    {!msg.readAt && <Badge variant="default">Unread</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.body}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span>From: {msg.sender?.name || msg.sender?.email}</span>
                    <span>To: {msg.recipient?.name || msg.recipient?.email}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(msg.createdAt)}
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
