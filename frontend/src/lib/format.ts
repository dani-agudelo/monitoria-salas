const timeZone = "America/Bogota";

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(value instanceof Date ? value : new Date(value));
}

export function shiftLabel(startedAt: string, leavesAt: string | null) {
  if (!leavesAt) return `Desde ${formatTime(startedAt)}`;
  return `${formatTime(startedAt)} – ${formatTime(leavesAt)}`;
}

export function currentTimeValue() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function timeOnTodayIso(time: string) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${day}T${time}:00-05:00`).toISOString();
}

export function formatToday() {
  const label = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone,
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function hoursBetween(start: string, end: string | null) {
  const stop = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, (stop - new Date(start).getTime()) / 3_600_000);
}

export function currentWeekDays() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    value("weekday"),
  );
  const daysFromMonday = index === 0 ? 6 : Math.max(0, index - 1);
  const monday = new Date(
    `${value("year")}-${value("month")}-${value("day")}T12:00:00-05:00`,
  );
  monday.setTime(monday.getTime() - daysFromMonday * 86_400_000);
  return Array.from({ length: 5 }, (_, offset) => {
    const date = new Date(monday.getTime() + offset * 86_400_000);
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    const label = new Intl.DateTimeFormat("es-CO", {
      timeZone,
      weekday: "short",
      day: "2-digit",
    }).format(date);
    return { key, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
}

export function bogotaDayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
