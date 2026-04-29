import { StatusBadge } from "./StatusBadge.js";
import { money, shortDate, escapeHtml } from "../utils/format.js";

export function WorkOrderCard(order) {
  return `
    <button class="work-order-card" data-route="work-order-detail" data-id="${order.id}" type="button">
      <div class="card-line">
        <strong>${escapeHtml(order.id)}</strong>
        ${StatusBadge(order.status)}
      </div>
      <h3>${escapeHtml(order.vehicleType)} | ${escapeHtml(order.unitNumber)}</h3>
      <p>${escapeHtml(order.problem)}</p>
      <div class="card-meta">
        <span>${escapeHtml(order.customer || "No customer")}</span>
        <span>${escapeHtml(order.serviceType)}</span>
        <span>${escapeHtml(order.technician || "Unassigned")}</span>
      </div>
      <div class="card-line card-foot">
        <span>Due ${shortDate(order.dueDate)}</span>
        <span>${money(order.laborCost + order.partsCost)}</span>
      </div>
    </button>
  `;
}
