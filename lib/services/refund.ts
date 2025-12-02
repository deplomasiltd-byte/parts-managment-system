// lib/services/refund.ts
import { db } from "@/db/drizzle";
import { refunds, sales, parts, inventory } from "@/db/schema";
import { eq } from "drizzle-orm";

type CreateRefundInput = {
  saleId: number;
  quantity: number;
  reason?: string;
  processedBy: string;
};

export async function createRefund(input: CreateRefundInput) {
  const { saleId, quantity, reason, processedBy } = input;

  // First, get the current sale record
  const [saleRecord] = await db
    .select()
    .from(sales)
    .where(eq(sales.id, saleId));

  if (!saleRecord) {
    throw new Error("Sale record not found");
  }

  if (!saleRecord.partId || !saleRecord.customerId) {
    throw new Error("Invalid sale record data");
  }

  // Validate quantity doesn't exceed original sale quantity
  if (quantity > saleRecord.quantity) {
    throw new Error("Refund quantity cannot exceed original sale quantity");
  }

  // Calculate refund amount (proportional to the quantity being refunded)
  const refundAmount =
    (parseFloat(saleRecord.totalAmount!.toString()) / saleRecord.quantity) *
    quantity;

  // Note: Using HTTP driver without transaction support
  // Operations will be executed sequentially without transaction isolation

  try {
    // 1. Create refund record
    const [newRefund] = await db
      .insert(refunds)
      .values({
        saleId,
        partId: saleRecord.partId!,
        customerId: saleRecord.customerId!,
        quantity,
        amount: refundAmount.toString(),
        reason,
        processedBy,
      })
      .returning();

    // 2. Get current part stock
    const [currentPart] = await db
      .select()
      .from(parts)
      .where(eq(parts.id, saleRecord.partId!));

    if (currentPart) {
      // Update with new stock quantity
      await db
        .update(parts)
        .set({
          currentStock: (currentPart.currentStock || 0) + quantity,
        })
        .where(eq(parts.id, saleRecord.partId!));

      // 3. Create inventory transaction record
      await db.insert(inventory).values({
        partId: saleRecord.partId!,
        change: quantity,
        reason: "refund",
        referenceId: newRefund.id,
        createdBy: processedBy,
      });
    }

    // 4. Update sale record
    const newQuantity = saleRecord.quantity - quantity;
    const newTotalAmount =
      parseFloat(saleRecord.totalAmount!.toString()) - refundAmount;
    const currentPaidAmount = parseFloat(
      saleRecord.paidAmount!.toString() || "0"
    );
    const newPaidAmount = Math.min(currentPaidAmount, newTotalAmount);
    const newOutstanding = Math.max(0, newTotalAmount - newPaidAmount);
    const isFullyPaid = newOutstanding <= 0;

    await db
      .update(sales)
      .set({
        quantity: newQuantity,
        totalAmount: newTotalAmount.toString(),
        paidAmount: newPaidAmount.toString(),
        outstanding: newOutstanding.toString(),
        isFullyPaid,
      })
      .where(eq(sales.id, saleId));

    return {
      refund: newRefund,
      refundAmount,
      newQuantity,
      newTotalAmount,
      newOutstanding,
    };
  } catch (error) {
    console.error("Error in refund processing:", error);
    throw new Error("Failed to process refund. Please try again.");
  }
}
