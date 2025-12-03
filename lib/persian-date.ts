// lib/persian-date.ts
import { format, formatDistanceToNow, isValid } from "date-fns";
import { faIR } from "date-fns/locale";

// Initialize Persian locale
export const persianLocale = faIR;

/**
 * Format a date to Persian date string (YYYY/MM/DD)
 */
export const formatPersianDate = (date: Date | string | number): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "تاریخ نامعتبر";
    return format(dateObj, "yyyy/MM/dd", { locale: persianLocale });
  } catch (error) {
    console.error("Error formatting Persian date:", error);
    return "خطا در تاریخ";
  }
};

/**
 * Format a date to Persian date with time (YYYY/MM/DD HH:mm)
 */
export const formatPersianDateTime = (date: Date | string | number): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "تاریخ نامعتبر";
    return format(dateObj, "yyyy/MM/dd HH:mm", { locale: persianLocale });
  } catch (error) {
    console.error("Error formatting Persian date time:", error);
    return "خطا در تاریخ";
  }
};

/**
 * Format a date to Persian date string for display (DD MMMM YYYY)
 */
export const formatPersianDateDisplay = (
  date: Date | string | number
): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "تاریخ نامعتبر";
    return format(dateObj, "dd MMMM yyyy", { locale: persianLocale });
  } catch (error) {
    console.error("Error formatting Persian date display:", error);
    return "خطا در تاریخ";
  }
};

/**
 * Format a date to Persian date string for forms (YYYY-MM-DD)
 */
export const formatPersianDateForInput = (
  date: Date | string | number
): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "";
    return format(dateObj, "yyyy-MM-dd", { locale: persianLocale });
  } catch (error) {
    console.error("Error formatting Persian date for input:", error);
    return "";
  }
};

/**
 * Format date to relative Persian time (e.g., "2 hours ago", "3 days ago")
 */
export const formatPersianRelativeTime = (
  date: Date | string | number
): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "تاریخ نامعتبر";
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: persianLocale,
    });
  } catch (error) {
    console.error("Error formatting Persian relative time:", error);
    return "خطا در تاریخ";
  }
};

/**
 * Format a date to Persian short date for tables (DD/MM/YY)
 */
export const formatPersianShortDate = (
  date: Date | string | number
): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "نامعتبر";
    return format(dateObj, "dd/MM/yy", { locale: persianLocale });
  } catch (error) {
    console.error("Error formatting Persian short date:", error);
    return "خطا";
  }
};

/**
 * Format a date to Persian month and year (MMMM YYYY)
 */
export const formatPersianMonthYear = (
  date: Date | string | number
): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "تاریخ نامعتبر";
    return format(dateObj, "MMMM yyyy", { locale: persianLocale });
  } catch (error) {
    console.error("Error formatting Persian month year:", error);
    return "خطا در تاریخ";
  }
};

/**
 * Format a date to Persian time only (HH:mm)
 */
export const formatPersianTime = (date: Date | string | number): string => {
  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (!isValid(dateObj)) return "00:00";
    return format(dateObj, "HH:mm", { locale: persianLocale });
  } catch (error) {
    console.error("Error formatting Persian time:", error);
    return "00:00";
  }
};

/**
 * Convert Persian date string (YYYY-MM-DD) to JavaScript Date
 */
export const parsePersianDate = (persianDateString: string): Date | null => {
  try {
    // This is a simple implementation - in a real app you might want to use a library like @univer/persian
    const parts = persianDateString.split("-");
    if (parts.length !== 3) return null;

    const [year, month, day] = parts.map(Number);
    // Convert Persian year to Gregorian (simplified - not exact)
    const gregorianYear = year - 622; // Rough conversion
    const date = new Date(gregorianYear, month - 1, day);

    return isValid(date) ? date : null;
  } catch (error) {
    console.error("Error parsing Persian date:", error);
    return null;
  }
};

/**
 * Get today's date in Persian format for inputs
 */
export const getTodayPersianDate = (): string => {
  return formatPersianDateForInput(new Date());
};

/**
 * Get current Persian datetime string for logs/debugging
 */
export const getCurrentPersianDateTime = (): string => {
  return formatPersianDateTime(new Date());
};

/**
 * Get current Persian date for file naming
 */
export const getCurrentPersianDateForFile = (): string => {
  try {
    return format(new Date(), "yyyy-MM-dd", { locale: persianLocale });
  } catch (error) {
    console.error("Error getting current Persian date for file:", error);
    return new Date().toISOString().split("T")[0];
  }
};

/**
 * Convert numbers to Persian numerals
 */
export const toPersianNumerals = (str: string | number): string => {
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/\d/g, (digit) => persianNumerals[Number(digit)]);
};

/**
 * Format currency with Persian numbers and AFN suffix
 */
export const formatPersianCurrency = (amount: number | string): string => {
  try {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "۰ افغانی";

    const formatted = num.toLocaleString("fa-IR");
    return `${formatted} افغانی`;
  } catch (error) {
    console.error("Error formatting Persian currency:", error);
    return `${amount} افغانی`;
  }
};

/**
 * Format number with Persian numerals
 */
export const formatPersianNumber = (num: number | string): string => {
  try {
    const number = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(number)) return "۰";
    return number.toLocaleString("fa-IR");
  } catch (error) {
    console.error("Error formatting Persian number:", error);
    return String(num);
  }
};

// Export all utilities as default object for easy importing
export const persianDateUtils = {
  formatPersianDate,
  formatPersianDateTime,
  formatPersianDateDisplay,
  formatPersianDateForInput,
  formatPersianRelativeTime,
  formatPersianShortDate,
  formatPersianMonthYear,
  formatPersianTime,
  parsePersianDate,
  getTodayPersianDate,
  getCurrentPersianDateTime,
  getCurrentPersianDateForFile,
  toPersianNumerals,
  formatPersianCurrency,
  formatPersianNumber,
};
