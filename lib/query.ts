export function parseIntParam(
  value: string | null,
  defaultValue: number,
  { min, max }: { min?: number; max?: number } = {}
) {
  if (value === null || value.trim() === "") {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }
  if (typeof min === "number" && parsed < min) {
    return min;
  }
  if (typeof max === "number" && parsed > max) {
    return max;
  }
  return parsed;
}

export function parseBooleanParam(value: string | null, defaultValue: boolean) {
  if (value === null || value.trim() === "") {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

export function parseExpandParam(value: string | null) {
  if (!value) return new Set<string>();
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return new Set(parts);
}
