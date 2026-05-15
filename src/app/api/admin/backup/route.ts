import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBackup, restoreBackup, listBackups } from "@/lib/backup";

async function verifyAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "LANDLORD" && user?.role !== "MANAGER") {
    return { error: "Admin access required", status: 403 };
  }

  return { userId: session.user.id };
}

/**
 * GET /api/admin/backup
 * List available backups
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { backups } = await listBackups();
    return NextResponse.json({ backups });
  } catch (error) {
    console.error("List backups error:", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}

/**
 * POST /api/admin/backup
 * Create a new backup
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const result = await createBackup(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log backup creation
    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "BACKUP_CREATED",
        entityType: "System",
        details: { filePath: result.filePath, size: result.size },
      },
    });

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      size: result.size,
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/backup
 * Restore from backup
 */
export async function PUT(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: "filePath required" }, { status: 400 });
    }

    const result = await restoreBackup(filePath);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log restore
    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "BACKUP_RESTORED",
        entityType: "System",
        details: { filePath },
      },
    });

    return NextResponse.json({ success: true, message: "Database restored successfully" });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
