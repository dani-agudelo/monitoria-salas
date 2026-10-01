export function embeddedText(value: unknown, key: string) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object" || !(key in row)) return "";
  const field = (row as Record<string, unknown>)[key];
  return typeof field === "string" ? field : "";
}
