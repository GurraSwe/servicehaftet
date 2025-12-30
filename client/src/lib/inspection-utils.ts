import { addMonths, format, parseISO, isValid } from "date-fns";
import { sv as svSE } from "date-fns/locale";

/**
 * Calculate the next inspection date based on last inspection date + 14 months
 * @param lastInspectionDate - Date string in YYYY-MM-DD format or null
 * @returns Date string in YYYY-MM-DD format or null
 */
export function calculateNextInspectionDate(lastInspectionDate: string | null): string | null {
  if (!lastInspectionDate) return null;
  
  try {
    const date = parseISO(lastInspectionDate);
    if (!isValid(date)) return null;
    
    const nextDate = addMonths(date, 14);
    return format(nextDate, "yyyy-MM-dd");
  } catch (error) {
    console.error("Error calculating next inspection date:", error);
    return null;
  }
}

/**
 * Format inspection date for display in Swedish format
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "10 januari 2024")
 */
export function formatInspectionDate(dateString: string | null): string {
  if (!dateString) return "";
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    
    return format(date, "d MMMM yyyy", { locale: svSE });
  } catch (error) {
    console.error("Error formatting inspection date:", error);
    return dateString;
  }
}

/**
 * Get the number of days until next inspection
 * @param nextInspectionDate - Date string in YYYY-MM-DD format
 * @returns Number of days until inspection (negative if past due)
 */
export function getDaysUntilInspection(nextInspectionDate: string | null): number | null {
  if (!nextInspectionDate) return null;
  
  try {
    const date = parseISO(nextInspectionDate);
    if (!isValid(date)) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error("Error calculating days until inspection:", error);
    return null;
  }
}

