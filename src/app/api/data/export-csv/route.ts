import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toCSV(data: any[], headers: string[]): string {
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      const str = String(value);
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "payments";
    const landlordId = session.user.id;

    let data: any[] = [];
    let filename = "";
    let headers: string[] = [];

    switch (type) {
      case "payments": {
        filename = `payments_${new Date().toISOString().split("T")[0]}.csv`;
        headers = ["ID", "Date", "Tenant", "Property", "Unit", "Amount", "Type", "Method", "Status", "Receipt"];
        const payments = await prisma.payment.findMany({
                   where: {},
         include: {
  tenant: true,
  lease: { include: { unit: true } },
},
          orderBy: { createdAt: "desc" },
        });
        data = payments.map((p) => ({
          Date: p.processedAt?.toISOString() || p.createdAt.toISOString(),
          Tenant: `${p.tenant.firstName} ${p.tenant.lastName}`,
                   Property: p.lease?.unit?.propertyId || "",
          Unit: p.lease?.unit?.unitNumber || "",
          Amount: p.amount,
          Type: p.type,
          Method: p.method,
          Status: p.status,
          Receipt: p.receiptNumber,
        }));
        break;
      }

      case "expenses": {
        filename = `expenses_${new Date().toISOString().split("T")[0]}.csv`;
        headers = ["ID", "Date", "Category", "Description", "Amount", "Property", "Vendor", "Tax Deductible"];
        const expenses = await prisma.expense.findMany({
          where: { landlordId, isDeleted: false },
         
          orderBy: { date: "desc" },
        });
        data = expenses.map((e) => ({
          ID: e.id,
          Date: e.date.toISOString(),
          Category: e.category,
          Description: e.description,
          Amount: e.amount,
        Property: e.propertyId || "",
          Vendor: e.vendor || "",
          "Tax Deductible": e.taxDeductible ? "Yes" : "No",
        }));
        break;
      }

      case "tenants": {
        filename = `tenants_${new Date().toISOString().split("T")[0]}.csv`;
        headers = ["ID", "First Name", "Last Name", "Email", "Phone", "Credit Score", "Emergency Contact", "Notes"];
        const tenants = await prisma.tenant.findMany({
          where: {
            leases: { some: { unit: { property: { landlordId } } } },
            isDeleted: false,
          },
          orderBy: { createdAt: "desc" },
        });
        data = tenants.map((t) => ({
          ID: t.id,
          "First Name": t.firstName,
          "Last Name": t.lastName,
          Email: t.email,
          Phone: t.phone || "",
          "Credit Score": t.creditScore || "",
          "Emergency Contact": t.emergencyName ? `${t.emergencyName} (${t.emergencyPhone})` : "",
          Notes: t.notes || "",
        }));
        break;
      }

      case "leases": {
        filename = `leases_${new Date().toISOString().split("T")[0]}.csv`;
        headers = ["ID", "Tenant", "Property", "Unit", "Start Date", "End Date", "Rent", "Deposit", "Status", "Auto Renew"];
        const leases = await prisma.lease.findMany({
          where: {
            unit: { property: { landlordId } },
            isDeleted: false,
          },
         include: {
  tenant: true,
  unit: true,
},
          orderBy: { createdAt: "desc" },
        });
        data = leases.map((l) => ({
          ID: l.id,
          Tenant: `${l.tenant.firstName} ${l.tenant.lastName}`,
                    Property: l.unit.propertyId || "",
          Unit: l.unit.unitNumber,
          "Start Date": l.startDate.toISOString(),
          "End Date": l.endDate.toISOString(),
          Rent: l.rentAmount,
          Deposit: l.depositAmount,
          Status: l.status,
          "Auto Renew": l.autoRenew ? "Yes" : "No",
        }));
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    const csv = toCSV(data, headers);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
