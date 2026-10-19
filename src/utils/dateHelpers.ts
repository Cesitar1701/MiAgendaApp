export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDisplayTime = (date: Date): string => {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const getFormattedCurrentDate = (date: Date = new Date()): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  return date.toLocaleDateString("es-AR", options).toUpperCase();
};

export const isSameDay = (dateA: Date, dateB: Date): boolean => {
  return toISODateString(dateA) === toISODateString(dateB);
};

const SPANISH_MONTHS: Record<string, string> = {
  ene: "01",
  feb: "02",
  mar: "03",
  abr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  sep: "09",
  set: "09",
  oct: "10",
  nov: "11",
  dic: "12",
};

export const resolveReminderIsoDate = (reminder: {
  isoDate?: string;
  targetTimestamp?: number;
  date: string;
}): string | null => {
  if (reminder.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(reminder.isoDate)) {
    return reminder.isoDate;
  }
  if (
    typeof reminder.targetTimestamp === "number" &&
    !isNaN(reminder.targetTimestamp)
  ) {
    return toISODateString(new Date(reminder.targetTimestamp));
  }
  if (!reminder.date) return null;

  const clean = reminder.date
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\bde\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Formato "16 oct 2026"
  const textMatch = clean.match(/^(\d{1,2})\s+([a-záéíóú]{3,})\s+(\d{4})$/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, "0");
    const monthPrefix = textMatch[2].slice(0, 3);
    const month = SPANISH_MONTHS[monthPrefix];
    const year = textMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  // Formato "16/10/2026"
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  return null;
};

export const isTodayOrFutureReminder = (
  reminder: {
    isoDate?: string;
    targetTimestamp?: number;
    date: string;
  },
  referenceDate: Date = new Date(),
): boolean => {
  const todayIso = toISODateString(referenceDate);
  const reminderIso = resolveReminderIsoDate(reminder);
  if (!reminderIso) return false;
  return reminderIso >= todayIso;
};

export type TimeUnit = "minutes" | "hours" | "days" | "weeks";

export const NOTIFICATION_PRESETS = [
  { label: "A los 10 segundos", seconds: -10 },
  { label: "5 minutos antes", seconds: 5 * 60 },
  { label: "15 minutos antes", seconds: 15 * 60 },
  { label: "30 minutos antes", seconds: 30 * 60 },
  { label: "1 hora antes", seconds: 60 * 60 },
  { label: "1 día antes", seconds: 1440 * 60 },
] as const;

export const calculateCustomLeadTime = (
  num: number,
  unit: TimeUnit,
): { seconds: number; label: string } => {
  switch (unit) {
    case "hours":
      return {
        seconds: num * 3600,
        label: `${num} ${num === 1 ? "hora" : "horas"} antes`,
      };
    case "days":
      return {
        seconds: num * 86400,
        label: `${num} ${num === 1 ? "día" : "días"} antes`,
      };
    case "weeks":
      return {
        seconds: num * 604800,
        label: `${num} ${num === 1 ? "semana" : "semanas"} antes`,
      };
    case "minutes":
    default:
      return {
        seconds: num * 60,
        label: `${num} ${num === 1 ? "minuto" : "minutos"} antes`,
      };
  }
};

export const formatLeadTimeLabel = (seconds: number): string => {
  const preset = NOTIFICATION_PRESETS.find((p) => p.seconds === seconds);
  if (preset) return preset.label;

  if (seconds % 604800 === 0) {
    return calculateCustomLeadTime(seconds / 604800, "weeks").label;
  }
  if (seconds % 86400 === 0) {
    return calculateCustomLeadTime(seconds / 86400, "days").label;
  }
  if (seconds % 3600 === 0) {
    return calculateCustomLeadTime(seconds / 3600, "hours").label;
  }
  const minutes = Math.max(1, Math.round(seconds / 60));
  return calculateCustomLeadTime(minutes, "minutes").label;
};

export const reconstructReminderDate = (reminder: {
  targetTimestamp?: number;
  isoDate?: string;
  date: string;
  time: string;
}): Date => {
  if (
    typeof reminder.targetTimestamp === "number" &&
    !isNaN(reminder.targetTimestamp)
  ) {
    return new Date(reminder.targetTimestamp);
  }

  const base = new Date();
  base.setSeconds(0, 0);

  const iso = resolveReminderIsoDate(reminder);
  if (iso) {
    const [year, month, day] = iso.split("-").map(Number);
    if (year && month && day) {
      base.setFullYear(year, month - 1, day);
    }
  }

  if (reminder.time) {
    const timeMatch = reminder.time.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      base.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    }
  }

  return base;
};

export const calcularSegundosRestantes = (
  targetTime: number,
  leadTimeSeconds: number,
  currentTime: number = Date.now(),
): number => {
  const fireTime = targetTime - leadTimeSeconds * 1000;
  return Math.floor((fireTime - currentTime) / 1000);
};
