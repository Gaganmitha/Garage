import { escapeHtml } from "../utils/format.js";

export function StatusBadge(status) {
  const key = String(status || "Pending").toLowerCase().replaceAll(" ", "-").replaceAll("/", "");
  return `<span class="status-badge status-${key}">${escapeHtml(status || "Pending")}</span>`;
}
