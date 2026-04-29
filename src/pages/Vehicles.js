import { VehicleForm } from "../components/VehicleForm.js";
import { escapeHtml, shortDate } from "../utils/format.js";

export function Vehicles({ vehicles, workOrders, editingVehicle }) {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Fleet files</p>
        <h1>Truck & Trailer Files</h1>
      </div>
      <div class="top-actions">
        <button class="secondary" data-action="toggle-bulk" type="button">Bulk Update</button>
        <button class="primary-action" data-action="new-vehicle" type="button">New File</button>
      </div>
    </header>

    <section class="panel bulk-panel" id="bulkPanel" hidden>
      <div class="section-heading">
        <div>
          <h2>Bulk Update Truck & Trailer Files</h2>
          <p class="muted-copy">Choose a CSV file from this computer or paste one unit per line. Existing files update by Type + Unit #. New files are created.</p>
        </div>
      </div>
      <form class="form-stack no-pad" id="bulkVehicleForm">
        <label>
          Import File
          <input id="bulkFileInput" type="file" accept=".csv,.txt,.xlsx,.xls" />
        </label>
        <label>
          Bulk File Data
          <textarea name="bulkData" class="bulk-textarea" placeholder="Type, Unit #, Make, Model, Year, Customer, VIN, Plate, Mileage, Engine, DOT Date, Registration Date, Last Service, Next PM Due"></textarea>
        </label>
        <div class="email-hint">CSV column order: Type, Unit #, Make, Model, Year, Customer, VIN, Plate, Mileage, Engine, DOT Date, Registration Date, Last Service, Next PM Due. If your file is Excel .xlsx, open it in Excel and save as CSV first.</div>
        <div class="form-actions">
          <span id="bulkResult"></span>
          <button class="secondary" data-action="toggle-bulk" type="button">Close</button>
          <button class="primary-action" type="submit">Apply Bulk Update</button>
        </div>
      </form>
    </section>

    <section class="vehicle-layout">
      <div class="vehicle-list">
        ${vehicles
          .map((vehicle) => {
            const jobs = workOrders.filter((order) => order.vehicleId === vehicle.id);
            return `
              <button class="vehicle-card" data-action="edit-vehicle" data-id="${vehicle.id}" type="button">
                <div class="card-line">
                  <strong>${escapeHtml(vehicle.type)} | ${escapeHtml(vehicle.unitNumber)}</strong>
                  <span>${jobs.length} order${jobs.length === 1 ? "" : "s"}</span>
                </div>
                <p>${escapeHtml(vehicle.customer || "No customer listed")}</p>
                <div class="vehicle-spec">${escapeHtml([vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "No make/model listed")}</div>
                <div class="card-meta">
                  <span>${escapeHtml(vehicle.vin || vehicle.plate || "No VIN/plate")}</span>
                  <span>${escapeHtml(vehicle.mileage || "No mileage")}</span>
                  <span>PM: ${escapeHtml(vehicle.nextPmDue || "Not set")}</span>
                  <span>${shortDate(vehicle.updatedAt)}</span>
                </div>
              </button>
            `;
          })
          .join("")}
      </div>
      <aside class="vehicle-panel">
        <h2>${editingVehicle?.id ? "Update File" : "Add File"}</h2>
        ${VehicleForm({ vehicle: editingVehicle || { type: "Truck" } })}
      </aside>
    </section>
  `;
}
