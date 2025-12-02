// app/api/refunds/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-session";
import { createRefund } from "@/lib/services/refund";
import { createRefundSchema } from "@/lib/validation/schemas";
import { db } from "@/db/drizzle";
import { refunds, sales, parts, inventory, user, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [currentUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createRefundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { saleId, quantity, reason } = parsed.data;

    // Add the current user as the one processing the refund
    const refundData = {
      saleId,
      quantity,
      reason: reason || undefined,
      processedBy: session.user.id,
    };

    const result = await createRefund(refundData);
    return NextResponse.json({
      success: true,
      data: result.refund,
      message: `Refund of ${quantity} items worth ${result.refundAmount} AFN processed successfully`,
    });
  } catch (err: any) {
    console.error("Error creating refund:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching refunds
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [currentUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const offset = (page - 1) * limit;

    // Build the query with joins
    let whereConditions = [];

    // Date filters
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      whereConditions.push(eq(refunds.refundDate, fromDateObj));
    }
    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999);
      whereConditions.push(eq(refunds.refundDate, toDateObj));
    }

    // Search filter - search in customer name, part name, part number
    if (search) {
      // This would need complex joins for search, so for simplicity we'll skip it for now
    }

    const refundsData = await db
      .select({
        id: refunds.id,
        saleId: refunds.saleId,
        partNumber: parts.partNumber,
        partName: parts.name,
        customerName: customers.name,
        quantity: refunds.quantity,
        amount: refunds.amount,
        reason: refunds.reason,
        refundDate: refunds.refundDate,
        processedBy: refunds.processedBy,
        processedByName: user.name,
      })
      .from(refunds)
      .leftJoin(sales, eq(refunds.saleId, sales.id))
      .leftJoin(parts, eq(refunds.partId, parts.id))
      .leftJoin(customers, eq(refunds.customerId, customers.id))
      .leftJoin(user, eq(refunds.processedBy, user.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(refunds.refundDate);

    const totalCount = await db.select({ count: refunds.id }).from(refunds);

    const total = totalCount.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: refundsData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error("Error fetching refunds:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
