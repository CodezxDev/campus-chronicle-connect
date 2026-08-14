export function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return "";
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export function paragraphs(text?: string | null) {
  return (text ?? "").split(/\n{1,}/).filter((p) => p.trim().length > 0);
}
