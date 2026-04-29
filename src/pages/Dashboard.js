import { StatsCard } from "../components/StatsCard.js";
import { WorkOrderCard } from "../components/WorkOrderCard.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { orderTotal } from "../entities/WorkOrder.js";
import { money, shortDate, escapeHtml } from "../utils/format.js";

export function Dashboard({ workOrders, vehicles }) {
  const open = workOrders.filter((order) => !["Completed", "Closed / Invoiced"].includes(order.status));
  const awaitingParts = workOrders.filter((order) => order.status === "Awaiting Parts");
  const inProgress = workOrders.filter((order) => order.status === "In Progress");
  const completed = workOrders.filter((order) => order.status === "Completed");
  const recent = [...workOrders].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);
  const activeValue = open.reduce((sum, order) => sum + orderTotal(order), 0);

  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Garage operations</p>
        <h1>Dashboard</h1>
      </div>
      <div class="top-actions">
        <button class="secondary" data-action="email-intake" type="button">Create From Email</button>
        <button class="primary-action" data-route="work-order-new" type="button">New Work Order</button>
      </div>
    </header>

    <section class="stats-grid">
      ${StatsCard({ label: "Active Work Orders", value: open.length, detail: `${money(activeValue)} active value`, tone: "accent" })}
      ${StatsCard({ label: "In Progress", value: inProgress.length, detail: "Being worked now" })}
      ${StatsCard({ label: "Awaiting Parts", value: awaitingParts.length, detail: "Blocked by parts" })}
      ${StatsCard({ label: "Vehicles", value: vehicles.length, detail: "Trucks and trailers" })}
      ${StatsCard({ label: "Completed", value: completed.length, detail: "Ready to close" })}
    </section>

    <section class="dashboard-grid">
      <div class="panel">
        <div class="section-heading">
          <h2>Status Overview</h2>
          <span>${open.length} open</span>
        </div>
        <div class="status-lanes">
          ${["Pending", "In Progress", "Awaiting Parts", "Awaiting Approval", "Ready for Review"]
            .map((status) => {
              const count = workOrders.filter((order) => order.status === status).length;
              return `<div class="status-row">${StatusBadge(status)}<strong>${count}</strong></div>`;
            })
            .join("")}
        </div>
      </div>

      <div class="panel">
        <div class="section-heading">
          <h2>Recent Activity</h2>
          <span>Latest updates</span>
        </div>
        <div class="activity-list">
          ${recent
            .map(
              (order) => `
                <button class="activity-item" data-route="work-order-detail" data-id="${order.id}" type="button">
                  <strong>${escapeHtml(order.id)} | ${escapeHtml(order.unitNumber)}</strong>
                  <span>${escapeHtml(order.status)} updated ${shortDate(order.updatedAt)}</span>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <h2>Priority Work Orders</h2>
        <span>Shop floor queue</span>
      </div>
      <div class="card-grid">
        ${open.slice(0, 6).map(WorkOrderCard).join("") || `<div class="empty-state">No active work orders.</div>`}
      </div>
    </section>
  `;
}
