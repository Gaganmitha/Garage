export function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function shortDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
