const TZ = "America/Sao_Paulo";

export function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatShortDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: TZ,
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return "";
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function readingTime(text?: string | null) {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function paragraphs(text?: string | null) {
  return (text ?? "").split(/\n{1,}/).filter((p) => p.trim().length > 0);
}
