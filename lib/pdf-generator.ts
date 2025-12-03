// lib/pdf-generator.ts
import { jsPDF } from "jspdf";
import fs from "fs/promises";
import path from "path";
import { Part } from "@/lib/types";
import { formatPersianDate, formatPersianCurrency } from "@/lib/persian-date";

// ----------------------
// Types
// ----------------------
export type SaleItem = {
  sale: {
    quantity: number;
    totalAmount: string | number;
  };
  part: Part | null;
  user: { name: string } | null;
};

export interface InvoiceData {
  customer: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  sales: SaleItem[];
  issueId: number;
  createdAt: Date;
  createdBy: string;
}

// ----------------------
// Theme Colors
// ----------------------
const DARK_GRAY: [number, number, number] = [45, 45, 45];
const DARK_RED: [number, number, number] = [139, 0, 0];
const LIGHT_GRAY: [number, number, number] = [240, 240, 240];
const TEXT_COLOR: [number, number, number] = [50, 50, 50];

// ----------------------
// Cached Assets
// ----------------------
let cachedFont: string | null = null;
let cachedLogo: string | null = null;
let cachedWatermark: string | null = null;

// ----------------------
// Initialize Fonts & Assets
// ----------------------
const initializeAssets = async () => {
  if (!cachedFont) {
    try {
      const fontPath = path.join(
        process.cwd(),
        "public/fonts/Vazirmatn-Regular.ttf"
      );
      const fontBuffer = await fs.readFile(fontPath);
      cachedFont = fontBuffer.toString("base64");
    } catch {
      cachedFont = "";
    }
  }

  if (!cachedLogo) {
    try {
      const logoBuffer = await fs.readFile(
        path.join(process.cwd(), "public/logo.png")
      );
      cachedLogo = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch {
      cachedLogo = "";
    }
  }

  if (!cachedWatermark) {
    try {
      const watermarkBuffer = await fs.readFile(
        path.join(process.cwd(), "public/watermark.png")
      );
      cachedWatermark = `data:image/png;base64,${watermarkBuffer.toString("base64")}`;
    } catch {
      cachedWatermark = "";
    }
  }
};

// ----------------------
// Persian numbers helper
// ----------------------
const toPersianNumber = (num: number | string) => {
  const p = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => p[+d]);
};

// ----------------------
// Generate Invoice PDF
// ----------------------
export async function generateInvoicePDF(
  data: InvoiceData
): Promise<Uint8Array> {
  await initializeAssets();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 120;

  // ----------------------
  // Add custom font
  // ----------------------
  if (cachedFont) {
    doc.addFileToVFS("Vazirmatn-Regular.ttf", cachedFont);
    doc.addFont("Vazirmatn-Regular.ttf", "Vazirmatn", "normal");
    doc.setFont("Vazirmatn");
  } else {
    doc.setFont("helvetica");
  }

  // ----------------------
  // Watermark
  // ----------------------
  if (cachedWatermark) {
    const wmSize = 300;
    doc.setGState(doc.GState({ opacity: 0.2 }));
    doc.addImage(
      cachedWatermark,
      "PNG",
      (pageWidth - wmSize) / 2,
      (pageHeight - wmSize) / 2,
      wmSize,
      wmSize,
      "",
      "FAST"
    );
    doc.setGState(doc.GState({ opacity: 1 }));
  }

  // ----------------------
  // Header
  // ----------------------
  doc.setFillColor(...DARK_GRAY);
  doc.rect(0, 0, pageWidth, 120, "F");

  if (cachedLogo) doc.addImage(cachedLogo, "PNG", 40, 15, 70, 70);

  doc.setFontSize(22);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text("Diplomasi Ltd", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(11);
  doc.text(
    "Between the second and third intersections of Parvan",
    pageWidth / 2,
    60,
    { align: "center" }
  );

  // ⭐ PHONE NUMBER ADDED HERE
  doc.text("Phone: +93 744 441 079", pageWidth / 2, 75, { align: "center" });

  doc.setFontSize(14);
  doc.text("بل پرزه جات وسایط", pageWidth / 2, 90, { align: "center" });

  doc.setFontSize(12);
  doc.text(
    "کابل -بین چهار راهی پروان دوم و سوم مقابل قصر زرین",
    pageWidth / 2,
    110,
    { align: "center" }
  );

  // ----------------------
  // Invoice ID & Date
  // ----------------------
  doc.setFontSize(10);
  doc.text(
    `آیدی فاکتور: INV-${toPersianNumber(data.issueId.toString().padStart(4, "0"))}`,
    40,
    140
  );

  doc.text(`تاریخ: ${formatPersianDate(data.createdAt)}`, pageWidth - 40, 140, {
    align: "right",
  });

  y = 180;

  // ----------------------
  // Table Header
  // ----------------------
  const colWidth = (pageWidth - 80) / 5;

  doc.setFillColor(...DARK_RED);
  doc.rect(40, y, pageWidth - 80, 25, "F");

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);

  const headers = ["#", "نام", "مقدار", "قیمت واحد", "مجموع"];
  headers.forEach((h, i) => doc.text(h, 45 + colWidth * i, y + 17));

  y += 30;
  doc.setTextColor(...TEXT_COLOR);

  // ----------------------
  // Table Rows
  // ----------------------
  let totalAmount = 0;

  data.sales.forEach((s, idx) => {
    if (y > pageHeight - 140) {
      doc.addPage();
      y = 80;

      if (cachedWatermark) {
        const wm = 300;
        doc.setGState(doc.GState({ opacity: 0.1 }));
        doc.addImage(
          cachedWatermark,
          "PNG",
          (pageWidth - wm) / 2,
          (pageHeight - wm) / 2,
          wm,
          wm,
          "",
          "FAST"
        );
        doc.setGState(doc.GState({ opacity: 1 }));
      }
    }

    const totalValue =
      typeof s.sale.totalAmount === "string"
        ? parseFloat(s.sale.totalAmount)
        : s.sale.totalAmount;

    const qty = s.sale.quantity;
    const unitPrice = qty ? totalValue / qty : 0;

    totalAmount += totalValue;

    // Alternating row colors
    if (idx % 2 === 0) {
      doc.setFillColor(...LIGHT_GRAY);
    } else {
      doc.setFillColor(255, 255, 255);
    }

    doc.rect(40, y, pageWidth - 80, 20, "F");

    const rowValues = [
      toPersianNumber(idx + 1),
      s.part?.name || "نامشخص",
      toPersianNumber(qty),
      toPersianNumber(unitPrice.toFixed(2)),
      toPersianNumber(totalValue.toFixed(2)),
    ];

    rowValues.forEach((val, i) => {
      doc.text(val, 45 + colWidth * i, y + 14);
    });

    y += 20;
  });

  // ----------------------
  // Total Box
  // ----------------------
  y += 30;

  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(pageWidth - 200, y, 160, 40, "F");

  doc.setFontSize(10);
  doc.setTextColor(...DARK_RED);
  doc.text("مجموع کل:", pageWidth - 180, y + 15);

  doc.setTextColor(...TEXT_COLOR);
  doc.text(`${formatPersianCurrency(totalAmount)}`, pageWidth - 180, y + 35);

  // ----------------------
  // Signature Section
  // ----------------------
  y += 100;

  doc.setFontSize(12);
  doc.setTextColor(...TEXT_COLOR);

  doc.text("امضاء مسئول", 40, y);
  doc.text("مهر شرکت", pageWidth - 200, y);

  // ----------------------
  // Footer
  // ----------------------
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);

  doc.text(
    "جنس فروخته شده بعد از 24 ساعت واپس گرفته نمیشود.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  return new Uint8Array(doc.output("arraybuffer"));
}

// ----------------------
// Helpers
// ----------------------
export async function generateInvoiceBase64(
  data: InvoiceData
): Promise<string> {
  const pdf = await generateInvoicePDF(data);
  return Buffer.from(pdf).toString("base64");
}

export async function generateInvoiceDataURL(
  data: InvoiceData
): Promise<string> {
  const base64 = await generateInvoiceBase64(data);
  return `data:application/pdf;base64,${base64}`;
}
