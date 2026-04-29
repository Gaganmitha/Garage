import { WorkOrderCard } from "../components/WorkOrderCard.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { money, shortDate, escapeHtml } from "../utils/format.js";

export function WorkOrders({ workOrders, query = "", status = "All" }) {
  const filtered = workOrders.filter((order) => {
    const haystack = [order.id, order.customer, order.unitNumber, order.vehicleType, order.serviceType, order.status, order.problem]
      .join(" ")
      .toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = status === "All" || order.status === status;
    return matchesQuery && matchesStatus;
  });

  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Repair queue</p>
        <h1>Work Orders</h1>
      </div>
      <div class="top-actions">
        <button class="secondary" data-action="email-intake" type="button">Create From Email</button>
        <button class="primary-action" data-route="work-order-new" type="button">New Work Order</button>
      </div>
    </header>

    <section class="toolbar surface">
      <input id="orderSearch" type="search" value="${escapeHtml(query)}" placeholder="Search customer, unit, service, status" />
      <select id="orderStatusFilter">
        ${["All", "Pending", "In Progress", "Awaiting Parts", "Awaiting Approval", "On Hold", "Ready for Review", "Completed", "Closed / Invoiced"]
          .map((item) => `<option ${item === status ? "selected" : ""}>${item}</option>`)
          .join("")}
      </select>
    </section>

    <section class="card-grid work-order-grid">
      ${filtered.map(WorkOrderCard).join("") || `<div class="empty-state">No matching work orders.</div>`}
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th><th>Unit</th><th>Customer</th><th>Service</th><th>Status</th><th>Tech</th><th>Total</th><th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (order) => `
                <tr data-route="work-order-detail" data-id="${order.id}">
                  <td><strong>${escapeHtml(order.id)}</strong></td>
                  <td>${escapeHtml(order.vehicleType)} | ${escapeHtml(order.unitNumber)}</td>
                  <td>${escapeHtml(order.customer)}</td>
                  <td>${escapeHtml(order.serviceType)}</td>
                  <td>${StatusBadge(order.status)}</td>
                  <td>${escapeHtml(order.technician || "Unassigned")}</td>
                  <td>${money(order.laborCost + order.partsCost)}</td>
                  <td>${shortDate(order.updatedAt)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}
