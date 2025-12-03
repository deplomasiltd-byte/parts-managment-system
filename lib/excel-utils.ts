// lib/excel-utils.ts
import * as XLSX from "xlsx";
import { getCurrentPersianDateForFile } from "./persian-date";

export interface ExcelPart {
  part_number: string;
  name: string;
  requested_quantity: number;
}

// Export to Excel with formatting
export const exportToExcel = (data: ExcelPart[]) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for Excel
  const excelData = data.map((item) => ({
    "شماره قطعه": item.part_number,
    "نام قطعه": item.name,
    "مقدار درخواستی": item.requested_quantity,
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // شماره قطعه
    { wch: 30 }, // نام قطعه
    { wch: 15 }, // مقدار درخواستی
  ];
  ws["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "اقدامات اولویت دار");

  // Generate filename with Persian timestamp
  const timestamp = getCurrentPersianDateForFile();
  const filename = `priority-actions-${timestamp}.xlsx`;

  // Export to file
  XLSX.writeFile(wb, filename);
};

// Import from Excel
export const importFromExcel = (file: File): Promise<ExcelPart[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel data to our format
        const importedData: ExcelPart[] = jsonData.map((row: any) => ({
          part_number: row["شماره قطعه"] || row["part_number"],
          name: row["نام قطعه"] || row["name"],
          requested_quantity: Number(
            row["مقدار درخواستی"] || row["requested_quantity"] || 0
          ),
        }));

        resolve(importedData);
      } catch (error) {
        reject(new Error("خطا در خواندن فایل اکسل"));
      }
    };

    reader.onerror = () => reject(new Error("خطا در بارگذاری فایل"));
    reader.readAsArrayBuffer(file);
  });
};

// Generate Excel template for import
export const generateExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      "شماره قطعه": "EXAMPLE-001",
      "نام قطعه": "نام قطعه نمونه",
      "مقدار درخواستی": 10,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // شماره قطعه
    { wch: 30 }, // نام قطعه
    { wch: 15 }, // مقدار درخواستی
  ];
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "قالب وارد کردن داده");
  XLSX.writeFile(wb, "template-priority-actions.xlsx");
};
