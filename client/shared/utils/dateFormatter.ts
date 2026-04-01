import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/es";
import "dayjs/locale/en";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

// Set default locale
dayjs.locale("en");

export const formatSecondToTimer = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`
    : `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// Función para formatear la fecha a un formato más legible y compacto
const formatDatetime = (
  isoDate: string,
  showSeconds = false,
  hour12 = true,
): string => {
  const date = dayjs(isoDate);

  if (showSeconds) {
    return hour12
      ? date.format("DD MMM YYYY, hh:mm:ss A")
      : date.format("DD MMM YYYY, HH:mm:ss");
  }

  return hour12
    ? date.format("DD MMM YYYY, hh:mm A")
    : date.format("DD MMM YYYY, HH:mm");
};

const formatDate = (isoDate: string): string => {
  return dayjs.utc(isoDate).format("DD MMM YYYY");
};

const formatSimpleDate = (isoDate: string): string => {
  return dayjs(isoDate).format("DD/MM/YYYY");
};

const dateToIsoString = (date: string): string => {
  // ISO LOCAL DATE to ISO UTC
  if (!date) return "";
  return dayjs(date).toISOString();
};

const dateFromIsoString = (isoDate: string): string => {
  if (!isoDate) return "";
  // ISO format to "DD-MM-YYYY"
  return dayjs(isoDate).format("DD-MM-YYYY");
};

const inputDateToLocal = (date: string): string => {
  // ISO LOCAL DATE to ISO UTC and add 6 hours
  if (!date) return "";
  // This gets the iso UTC MM-DD-YYYYT00:00:00.000Z
  // Then adds 6 hours then returns yyyy-MM-dd
  return dayjs(date).add(6, "hour").format("YYYY-MM-DD");
};

const isoStringToDateWithTime = (
  isoDate: string,
): { date: string; time: string } => {
  const parsedDate = dayjs(isoDate);

  return {
    date: parsedDate.format("YYYY-MM-DD"),
    time: parsedDate.format("HH:mm"),
  };
};

const timeAgo = (
  isoDate: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string => {
  const date = dayjs(isoDate);
  const now = dayjs();
  const diffInSeconds = now.diff(date, "second");

  if (diffInSeconds <= 0) return t("justNow");

  if (diffInSeconds < 60) {
    return t("secondsAgo", { count: diffInSeconds });
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t("minutesAgo", { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t("hoursAgo", { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return t("daysAgo", { count: diffInDays });
  }

  // If more than 7 days, format the full date
  return formatDatetime(isoDate);
};

/**
 * Format date for email display with locale and timezone support
 * @param isoDate - ISO date string in UTC (e.g., "2025-12-28T06:00:00+00:00")
 * @param locale - Locale code (e.g., "es" or "en")
 * @param timezone - IANA timezone (e.g., "America/Costa_Rica", "America/New_York")
 * @returns Formatted date with time in user's timezone (e.g., "28 Dic 2025, 00:00" in Spanish or "28 Dec 2025, 12:00 AM" in English)
 */
const formatDateForEmail = (
  isoDate: string,
  locale: string = "es",
  timezone: string = "America/Costa_Rica",
): string => {
  // Use 24-hour format for Spanish, 12-hour for English
  const timeFormat = locale === "en" ? "hh:mm A" : "HH:mm";

  // Convert UTC date to user's timezone
  return dayjs
    .utc(isoDate)
    .tz(timezone)
    .locale(locale)
    .format(`DD MMM YYYY, ${timeFormat}`);
};

export function formatShortDate(iso: string): string {
  const d = dayjs(iso);
  if (!d.isValid()) return iso;
  return d.format("YYYY-MM-DD");
}

export function nowIso(): string {
  return dayjs().toISOString();
}

export function formatDistanceToNow(iso: string): string {
  return dayjs(iso).fromNow();
}

export {
  formatDatetime,
  formatDate,
  dateToIsoString,
  dateFromIsoString,
  timeAgo,
  formatSimpleDate,
  isoStringToDateWithTime,
  inputDateToLocal,
  formatDateForEmail,
};
