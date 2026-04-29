import { serviceTypes, workOrderStatuses } from "../entities/WorkOrder.js";
import { escapeHtml } from "../utils/format.js";

export function WorkOrderForm({ order = {}, vehicles = [] } = {}) {
  return `
    <form class="surface form-stack" id="workOrderForm">
      <input name="id" type="hidden" value="${escapeHtml(order.id || "")}" />
      <div class="form-grid">
        <label>Customer<input name="customer" required value="${escapeHtml(order.customer || "")}" /></label>
        <label>Vehicle
          <select name="vehicleId">
            <option value="">New or unlisted vehicle</option>
            ${vehicles
              .map(
                (vehicle) =>
                  `<option value="${vehicle.id}" ${vehicle.id === order.vehicleId ? "selected" : ""}>${escapeHtml(
                    `${vehicle.type} | ${vehicle.unitNumber} | ${vehicle.customer}`,
                  )}</option>`,
              )
              .join("")}
          </select>
        </label>
        <label>Type
          <select name="vehicleType">
            <option ${order.vehicleType === "Truck" ? "selected" : ""}>Truck</option>
            <option ${order.vehicleType === "Trailer" ? "selected" : ""}>Trailer</option>
          </select>
        </label>
        <label>Unit #<input name="unitNumber" required value="${escapeHtml(order.unitNumber || "")}" /></label>
        <label>VIN / Plate<input name="vin" value="${escapeHtml(order.vin || "")}" /></label>
        <label>Mileage / Hours<input name="mileage" value="${escapeHtml(order.mileage || "")}" /></label>
        <label>Service
          <select name="serviceType">
            ${serviceTypes
              .map((type) => `<option ${type === order.serviceType ? "selected" : ""}>${type}</option>`)
              .join("")}
          </select>
        </label>
        <label>Status
          <select name="status">
            ${workOrderStatuses
              .map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`)
              .join("")}
          </select>
        </label>
        <label>Priority
          <select name="priority">
            ${["Normal", "Urgent", "Roadside", "Fleet"]
              .map((priority) => `<option ${priority === order.priority ? "selected" : ""}>${priority}</option>`)
              .join("")}
          </select>
        </label>
        <label>Technician<input name="technician" value="${escapeHtml(order.technician || "")}" /></label>
        <label>Due Date<input name="dueDate" type="date" value="${escapeHtml(order.dueDate || "")}" /></label>
      </div>
      <label>Reported Problem<textarea name="problem" required>${escapeHtml(order.problem || "")}</textarea></label>
      <div class="form-grid two">
        <label>Labor Line Items<textarea name="labor">${escapeHtml((order.labor || []).join("\n"))}</textarea></label>
        <label>Parts Line Items<textarea name="parts">${escapeHtml((order.parts || []).join("\n"))}</textarea></label>
      </div>
      <label>Completion Notes<textarea name="completionNotes">${escapeHtml(order.completionNotes || "")}</textarea></label>
      <div class="form-grid compact">
        <label>Labor Hours<input name="laborHours" type="number" min="0" step="0.1" value="${order.laborHours || ""}" /></label>
        <label>Labor Cost<input name="laborCost" type="number" min="0" step="0.01" value="${order.laborCost || ""}" /></label>
        <label>Parts Cost<input name="partsCost" type="number" min="0" step="0.01" value="${order.partsCost || ""}" /></label>
      </div>
      <div class="form-actions">
        ${order.id ? `<button class="danger" data-action="delete-order" data-id="${order.id}" type="button">Delete</button>` : "<span></span>"}
        <button class="secondary" data-route="work-orders" type="button">Cancel</button>
        <button class="primary-action" type="submit">Save Work Order</button>
      </div>
    </form>
  `;
}

export function orderFromForm(form, vehicle) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    ...data,
    vehicleType: vehicle?.type || data.vehicleType,
    unitNumber: vehicle?.unitNumber || data.unitNumber,
    vin: vehicle?.vin || data.vin,
    mileage: vehicle?.mileage || data.mileage,
    customer: data.customer || vehicle?.customer || "",
  };
}
