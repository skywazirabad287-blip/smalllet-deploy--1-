export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfYear, endOfYear, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "profit-loss";
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const landlordId = session.user.id;

    // Fetch all data for the year
    const [payments, expenses, properties] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: "COMPLETED",
          processedAt: { gte: yearStart, lte: yearEnd },
          tenant: { leases: { some: { unit: { property: { landlordId } } } } },
        },
        include: {
          tenant: { select: { firstName: true, lastName: true } },
          lease: { include: { unit: { include: { property: { select: { name: true } } } } } },
        },
      }),
      prisma.expense.findMany({
        where: {
          landlordId,
          date: { gte: yearStart, lte: yearEnd },
        },
        include: {
          property: { select: { name: true } },
        },
      }),
      prisma.property.findMany({
        where: { landlordId },
        include: {
          units: {
            include: {
              leases: {
                where: { status: "ACTIVE" },
                include: { tenant: true },
              },
            },
          },
        },
      }),
    ]);

    // Calculate totals
    const totalIncome = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
    const netIncome = totalIncome - totalExpenses;

    // Group by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 0);
      const monthPayments = payments.filter(
               (p) => p.processedAt && p.processedAt >= monthStart && p.processedAt <= monthEnd
      );
      const monthExpenses = expenses.filter(
        (e) => e.date >= monthStart && e.date <= monthEnd
      );
      return {
        month: format(monthStart, "MMM"),
        income: monthPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        expenses: monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0),
        net: monthPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) -
          monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0),
      };
    });

    // Group expenses by category
    const expenseByCategory = expenses.reduce((acc: Record<string, number>, e) => {
      const cat = e.category;
      acc[cat] = (acc[cat] || 0) + parseFloat(e.amount.toString());
      return acc;
    }, {});

    // Property performance
    const propertyPerformance = properties.map((prop) => {
      const propIncome = payments
        .filter((p) => p.lease?.unit?.propertyId === prop.id)
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const propExpenses = expenses
        .filter((e) => e.propertyId === prop.id)
        .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
      return {
        property: prop.name,
        income: propIncome,
        expenses: propExpenses,
        net: propIncome - propExpenses,
        units: prop.units.length,
        occupied: prop.units.filter((u) => u.status === "OCCUPIED").length,
      };
    });

    // Tax summary
    const taxDeductibleExpenses = expenses
      .filter((e) => e.taxDeductible)
      .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    return NextResponse.json({
      year,
      summary: {
        totalIncome,
        totalExpenses,
        netIncome,
        taxDeductibleExpenses,
        occupancyRate: properties.length > 0
          ? Math.round(
              (properties.reduce((sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length, 0) /
                properties.reduce((sum, p) => sum + p.units.length, 0)) *
                100
            )
          : 0,
      },
      monthlyData,
      expenseByCategory,
      propertyPerformance,
      transactions: payments.map((p) => ({
        date: p.processedAt,
        description: `${p.type} - ${p.tenant.firstName} ${p.tenant.lastName}`,
        property: p.lease?.unit?.property?.name,
        amount: parseFloat(p.amount.toString()),
        type: "income",
      })).concat(
        expenses.map((e) => ({
          date: e.date,
          description: e.description,
          property: e.property?.name,
          amount: parseFloat(e.amount.toString()),
          type: "expense",
          category: e.category,
        }))
      ),
    });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
