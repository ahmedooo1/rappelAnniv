import { format, differenceInDays, addYears, isBefore, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { type Birthday } from "@shared/schema";

/**
 * Calculate days until next birthday from a birthdate
 */
export function calculateDaysUntilBirthday(birthdate: Date): number {
  const today = new Date();
  
  // Set the birthdate to current year
  const currentYearBirthday = new Date(
    today.getFullYear(),
    birthdate.getMonth(),
    birthdate.getDate()
  );
  
  // If the birthday this year has passed, calculate for next year
  if (isBefore(currentYearBirthday, today)) {
    const nextYearBirthday = addYears(currentYearBirthday, 1);
    return differenceInDays(nextYearBirthday, today);
  }
  
  return differenceInDays(currentYearBirthday, today);
}

/**
 * Format a date as "DD MMM (dans X jours)"
 */
export function formatDate(date: Date, daysUntil: number): string {
  const formattedDate = format(date, "d MMMM", { locale: fr });
  return `${formattedDate} (dans ${daysUntil} jours)`;
}

/**
 * Sort birthdays by proximity to current date
 */
export function sortBirthdaysByProximity(birthdays: Birthday[]): Birthday[] {
  return [...birthdays].sort((a, b) => {
    const daysUntilA = calculateDaysUntilBirthday(new Date(a.birthdate));
    const daysUntilB = calculateDaysUntilBirthday(new Date(b.birthdate));
    return daysUntilA - daysUntilB;
  });
}
