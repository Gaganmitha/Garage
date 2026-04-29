export function StatsCard({ label, value, detail, tone = "" }) {
  return `
    <article class="stats-card ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail || ""}</small>
    </article>
  `;
}
