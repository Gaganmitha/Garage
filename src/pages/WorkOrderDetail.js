import { WorkOrderForm } from "../components/WorkOrderForm.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { money, shortDate, escapeHtml } from "../utils/format.js";

export function WorkOrderDetail({ order, vehicles, isNew = false }) {
  if (isNew) {
    return `
      <header class="topbar">
        <div>
          <p class="eyebrow">New repair job</p>
          <h1>New Work Order</h1>
        </div>
      </header>
      ${WorkOrderForm({ vehicles, order: { status: "Pending", priority: "Normal", serviceType: "Inspection", vehicleType: "Truck" } })}
    `;
  }

  if (!order) {
    return `<section class="empty-state">Work order not found.</section>`;
  }

  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Work order detail</p>
        <h1>${escapeHtml(order.id)} | ${escapeHtml(order.vehicleType)} ${escapeHtml(order.unitNumber)}</h1>
      </div>
      <button class="secondary" data-route="work-orders" type="button">Back to Orders</button>
    </header>

    <section class="detail-layout">
      <div class="panel">
        <div class="detail-head">
          <div>
            ${StatusBadge(order.status)}
            <h2>${escapeHtml(order.problem)}</h2>
          </div>
          <strong>${money(order.laborCost + order.partsCost)}</strong>
        </div>
        <div class="detail-grid">
          <span><strong>Customer</strong>${escapeHtml(order.customer)}</span>
          <span><strong>Service</strong>${escapeHtml(order.serviceType)}</span>
          <span><strong>Technician</strong>${escapeHtml(order.technician || "Unassigned")}</span>
          <span><strong>Priority</strong>${escapeHtml(order.priority)}</span>
          <span><strong>Due</strong>${shortDate(order.dueDate)}</span>
          <span><strong>VIN / Plate</strong>${escapeHtml(order.vin || "Not listed")}</span>
        </div>
        <div class="line-items">
          <h3>Labor Line Items</h3>
          ${lineItems(order.labor)}
          <h3>Parts Line Items</h3>
          ${lineItems(order.parts)}
          <h3>Completion Notes</h3>
          <p>${escapeHtml(order.completionNotes || "No completion notes yet.")}</p>
        </div>
      </div>

      <aside class="panel activity-panel">
        <h2>Activity</h2>
        ${(order.activity || []).map((item) => `<div class="activity-note">${escapeHtml(item)}</div>`).join("")}
      </aside>
    </section>

    <section class="section-heading edit-heading">
      <h2>Edit Work Order</h2>
    </section>
    ${WorkOrderForm({ order, vehicles })}
  `;
}

function lineItems(items = []) {
  if (!items.length) return `<div class="empty-line">No line items listed.</div>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}
