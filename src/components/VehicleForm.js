import { escapeHtml } from "../utils/format.js";

export function VehicleForm({ vehicle = {} } = {}) {
  return `
    <form class="surface form-stack" id="vehicleForm">
      <input name="id" type="hidden" value="${escapeHtml(vehicle.id || "")}" />
      <div class="form-grid">
        <label>Type
          <select name="type">
            <option ${vehicle.type === "Truck" ? "selected" : ""}>Truck</option>
            <option ${vehicle.type === "Trailer" ? "selected" : ""}>Trailer</option>
          </select>
        </label>
        <label>Unit #<input name="unitNumber" required value="${escapeHtml(vehicle.unitNumber || "")}" /></label>
        <label>Customer<input name="customer" value="${escapeHtml(vehicle.customer || "")}" /></label>
        <label>Year<input name="year" value="${escapeHtml(vehicle.year || "")}" /></label>
        <label>Make<input name="make" placeholder="Freightliner" value="${escapeHtml(vehicle.make || "")}" /></label>
        <label>Model<input name="model" value="${escapeHtml(vehicle.model || "")}" /></label>
        <label>Engine<input name="engine" value="${escapeHtml(vehicle.engine || "")}" /></label>
        <label>VIN<input name="vin" value="${escapeHtml(vehicle.vin || "")}" /></label>
        <label>Plate<input name="plate" value="${escapeHtml(vehicle.plate || "")}" /></label>
        <label>Mileage / Hours<input name="mileage" value="${escapeHtml(vehicle.mileage || "")}" /></label>
        <label>DOT Date<input name="dotDate" type="date" value="${escapeHtml(vehicle.dotDate || "")}" /></label>
        <label>Registration Date<input name="registrationDate" type="date" value="${escapeHtml(vehicle.registrationDate || "")}" /></label>
        <label>Last Service<input name="lastServiceDate" type="date" value="${escapeHtml(vehicle.lastServiceDate || "")}" /></label>
        <label>Next PM Due<input name="nextPmDue" value="${escapeHtml(vehicle.nextPmDue || "")}" /></label>
      </div>
      <label>Truck / Trailer File Notes<textarea name="notes">${escapeHtml(vehicle.notes || "")}</textarea></label>
      <div class="form-actions">
        ${vehicle.id ? `<button class="danger" data-action="delete-vehicle" data-id="${vehicle.id}" type="button">Delete</button>` : "<span></span>"}
        <button class="secondary" data-action="close-panel" type="button">Cancel</button>
        <button class="primary-action" type="submit">Save File</button>
      </div>
    </form>
  `;
}
