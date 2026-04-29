const STORE_KEY = "garage-desk-state-v2";
const LEGACY_KEY = "truck-repair-work-orders";
const SETTINGS_KEY = "garage-desk-settings";

const statuses = ["Pending", "In Progress", "Awaiting Parts", "Awaiting Approval", "On Hold", "Ready for Review", "Completed", "Closed / Invoiced"];
const serviceTypes = ["Inspection", "Brakes", "Electrical", "Engine", "Hydraulics", "Tires", "Trailer Body", "Preventive Maintenance", "Other"];

function createVehicle(data = {}) {
  return {
    id: data.id || `VEH-${Date.now()}`,
    type: data.type || "Truck",
    unitNumber: data.unitNumber || "",
    vin: data.vin || "",
    plate: data.plate || "",
    customer: data.customer || "",
    make: data.make || "",
    model: data.model || "",
    year: data.year || "",
    engine: data.engine || "",
    mileage: data.mileage || "",
    dotDate: data.dotDate || "",
    registrationDate: data.registrationDate || "",
    lastServiceDate: data.lastServiceDate || "",
    nextPmDue: data.nextPmDue || "",
    notes: data.notes || "",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createWorkOrder(data = {}) {
  const now = new Date().toISOString();
  return {
    id: data.id || nextWorkOrderId(data.existingIds || []),
    vehicleId: data.vehicleId || "",
    vehicleType: data.vehicleType || "Truck",
    unitNumber: data.unitNumber || "",
    vin: data.vin || "",
    mileage: data.mileage || "",
    customer: data.customer || "",
    serviceType: data.serviceType || "Inspection",
    problem: data.problem || "",
    status: data.status || "Pending",
    priority: data.priority || "Normal",
    technician: data.technician || "",
    dueDate: data.dueDate || "",
    parts: Array.isArray(data.parts) ? data.parts : textToLines(data.parts),
    labor: Array.isArray(data.labor) ? data.labor : textToLines(data.labor || data.tasks),
    completionNotes: data.completionNotes || data.completion || "",
    activity: Array.isArray(data.activity) ? data.activity : [`Created ${new Date(now).toLocaleString()}`],
    laborHours: Number(data.laborHours || 0),
    laborCost: Number(data.laborCost || 0),
    partsCost: Number(data.partsCost || 0),
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}

function textToLines(value = "") {
  return String(value).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function nextWorkOrderId(existingIds) {
  const numbers = existingIds.map((id) => Number(String(id).replace("WO-", ""))).filter(Boolean);
  return `WO-${numbers.length ? Math.max(...numbers) + 1 : 1001}`;
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function shortDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function orderTotal(order) {
  return Number(order.laborCost || 0) + Number(order.partsCost || 0);
}

const seedVehicles = [
  createVehicle({ id: "VEH-1", type: "Truck", unitNumber: "Unit 42", plate: "NYF-421", customer: "North Yard Fleet", mileage: "186,240", notes: "Air brake issue reported during morning dispatch." }),
  createVehicle({ id: "VEH-2", type: "Trailer", unitNumber: "Trailer 7", vin: "VIN ending 8831", customer: "Hillside Hauling", mileage: "94,010", notes: "Hydraulic lift trailer." }),
];

const seedWorkOrders = [
  createWorkOrder({ id: "WO-1001", vehicleId: "VEH-1", vehicleType: "Truck", unitNumber: "Unit 42", customer: "North Yard Fleet", vin: "Plate NYF-421", mileage: "186,240", serviceType: "Brakes", problem: "Air brake pressure dropping overnight.", labor: ["Inspect air lines", "Check fittings", "Replace leaking chamber if confirmed"], parts: ["Brake chamber ordered from local supplier"], status: "Awaiting Parts", priority: "Urgent", technician: "Mike", laborHours: 1.5, laborCost: 180, partsCost: 145 }),
  createWorkOrder({ id: "WO-1002", vehicleId: "VEH-2", vehicleType: "Trailer", unitNumber: "Trailer 7", customer: "Hillside Hauling", vin: "VIN ending 8831", mileage: "94,010", serviceType: "Hydraulics", problem: "Hydraulic leak near lift cylinder.", labor: ["Clean area", "Pressure test", "Replace hose assembly"], parts: ["Hydraulic hose assembly in stock"], status: "In Progress", priority: "Normal", technician: "Ana", laborHours: 2, laborCost: 240, partsCost: 96 }),
];

let state = loadState();
let route = { page: "dashboard" };
let orderQuery = "";
let orderStatus = "All";
let orderPriority = "All";
let editingVehicleId = "";
let settings = loadSettings();
const app = document.querySelector("#app");

function loadState() {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return freshState();
    }
  }

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const migrated = migrateLegacy(JSON.parse(legacy));
      localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      return freshState();
    }
  }

  return freshState();
}

function freshState() {
  return { vehicles: seedVehicles, workOrders: seedWorkOrders };
}

function migrateLegacy(orders) {
  const vehicles = [];
  const workOrders = orders.map((order, index) => {
    const vehicle = createVehicle({ id: `VEH-L${index + 1}`, type: order.unitType || "Truck", unitNumber: order.truck || "", vin: order.vin || "", customer: order.customer || "", mileage: order.mileage || "" });
    vehicles.push(vehicle);
    return createWorkOrder({ id: order.id, vehicleId: vehicle.id, vehicleType: vehicle.type, unitNumber: vehicle.unitNumber, vin: order.vin, mileage: order.mileage, customer: order.customer, serviceType: "Other", problem: order.problem, status: order.status, priority: order.priority, technician: order.technician, dueDate: order.dueDate, parts: order.parts, labor: order.tasks, completionNotes: order.completion, laborHours: order.laborHours, laborCost: order.laborCost, partsCost: order.partsCost, createdAt: order.createdAt, updatedAt: order.updatedAt });
  });
  return { vehicles, workOrders };
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (!saved) return { intakeEmail: "repairs@nationwidelogistics.com", shopName: "Nationwide Logistics Inc" };
  try {
    return JSON.parse(saved);
  } catch {
    return { intakeEmail: "repairs@nationwidelogistics.com", shopName: "Nationwide Logistics Inc" };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function upsertVehicle(vehicle) {
  const normalized = createVehicle(vehicle);
  const index = state.vehicles.findIndex((item) => item.id === normalized.id);
  if (index >= 0) state.vehicles[index] = normalized;
  else state.vehicles.unshift(normalized);
  saveState();
  return normalized;
}

function upsertWorkOrder(order) {
  const existingIds = state.workOrders.map((item) => item.id);
  const normalized = createWorkOrder({ ...order, existingIds });
  const existing = state.workOrders.find((item) => item.id === normalized.id);
  if (existing) normalized.activity = [`Updated ${new Date().toLocaleString()}`, ...existing.activity.slice(0, 7)];
  const vehicle = ensureVehicleFromOrder(normalized);
  normalized.vehicleId = vehicle.id;
  const index = state.workOrders.findIndex((item) => item.id === normalized.id);
  if (index >= 0) state.workOrders[index] = normalized;
  else state.workOrders.unshift(normalized);
  saveState();
  return normalized;
}

function ensureVehicleFromOrder(order) {
  const existing = state.vehicles.find((vehicle) => vehicle.id === order.vehicleId) || state.vehicles.find((vehicle) => vehicle.unitNumber.toLowerCase() === order.unitNumber.toLowerCase() && vehicle.type === order.vehicleType);
  const vehicle = createVehicle({ ...(existing || {}), id: existing && existing.id, type: order.vehicleType, unitNumber: order.unitNumber, vin: order.vin, customer: order.customer, mileage: order.mileage });
  const index = state.vehicles.findIndex((item) => item.id === vehicle.id);
  if (index >= 0) state.vehicles[index] = vehicle;
  else state.vehicles.unshift(vehicle);
  return vehicle;
}

function render() {
  app.innerHTML = Layout({ activePage: activePageName(), content: pageContent() }) + EmailDialog();
  bindForms();
}

function activePageName() {
  return route.page === "work-order-detail" || route.page === "work-order-new" ? "work-orders" : route.page;
}

function pageContent() {
  if (route.page === "work-orders") return WorkOrders();
  if (route.page === "work-order-detail") return WorkOrderDetail(state.workOrders.find((item) => item.id === route.id));
  if (route.page === "work-order-new") return WorkOrderNew();
  if (route.page === "vehicles") return VehiclesPage();
  if (route.page === "email-setup") return EmailSetupPage();
  return Dashboard();
}

function Layout({ activePage, content }) {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><img class="brand-logo" src="assets/garage-desk-logo.svg" alt="Nationwide Logistics Inc logo" /><div><strong>Nationwide Logistics Inc</strong><span>Truck & trailer repair</span></div></div>
        <nav class="nav-tabs">
          ${navButton("dashboard", "Dashboard", activePage)}
          ${navButton("work-orders", "Work Orders", activePage)}
          ${navButton("vehicles", "Vehicles", activePage)}
          ${navButton("email-setup", "Email Setup", activePage)}
        </nav>
      </aside>
      <main class="main">${content}</main>
    </div>`;
}

function navButton(page, label, activePage) {
  return `<button class="nav-tab ${activePage === page ? "active" : ""}" data-route="${page}" type="button">${label}</button>`;
}

function StatusBadge(status) {
  const key = String(status || "Pending").toLowerCase().replaceAll(" ", "-").replaceAll("/", "");
  return `<span class="status-badge status-${key}">${escapeHtml(status || "Pending")}</span>`;
}

function StatsCard(label, value, detail, tone = "") {
  return `<article class="stats-card ${tone}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function Dashboard() {
  const open = state.workOrders.filter((order) => !["Completed", "Closed / Invoiced"].includes(order.status));
  const activeValue = open.reduce((sum, order) => sum + orderTotal(order), 0);
  const recent = [...state.workOrders].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);
  return `
    <header class="topbar"><div><p class="eyebrow">Garage operations</p><h1>Dashboard</h1></div><div class="top-actions"><button class="secondary" data-action="email-intake" type="button">Create From Email</button><button class="primary-action" data-route="work-order-new" type="button">New Work Order</button></div></header>
    <section class="email-banner"><div><strong>Customer repair email</strong><span>${escapeHtml(settings.intakeEmail)}</span></div><a href="mailto:${escapeHtml(settings.intakeEmail)}?subject=Repair%20Request" class="mailto-link">Open Email</a><button class="secondary" data-route="email-setup" type="button">Setup</button></section>
    <section class="stats-grid">
      ${StatsCard("Active Work Orders", open.length, `${money(activeValue)} active value`, "accent")}
      ${StatsCard("In Progress", countStatus("In Progress"), "Being worked now")}
      ${StatsCard("Awaiting Parts", countStatus("Awaiting Parts"), "Blocked by parts")}
      ${StatsCard("Vehicles", state.vehicles.length, "Trucks and trailers")}
      ${StatsCard("Urgent", countPriority("Urgent") + countPriority("Roadside"), "High priority jobs", "hot")}
    </section>
    <section class="dashboard-grid">
      <div class="panel"><div class="section-heading"><h2>Status Overview</h2><span>${open.length} open</span></div><div class="status-lanes">${["Pending", "In Progress", "Awaiting Parts", "Awaiting Approval", "Ready for Review"].map((status) => `<div class="status-row">${StatusBadge(status)}<strong>${countStatus(status)}</strong></div>`).join("")}</div></div>
      <div class="panel"><div class="section-heading"><h2>Recent Activity</h2><span>Latest updates</span></div><div class="activity-list">${recent.map((order) => `<button class="activity-item" data-route="work-order-detail" data-id="${order.id}" type="button"><strong>${escapeHtml(order.id)} | ${escapeHtml(order.unitNumber)}</strong><span>${escapeHtml(order.status)} updated ${shortDate(order.updatedAt)}</span></button>`).join("")}</div></div>
    </section>
    <section class="panel"><div class="section-heading"><h2>Priority Work Orders</h2><span>Shop floor queue</span></div><div class="card-grid">${open.slice(0, 6).map(WorkOrderCard).join("") || `<div class="empty-state">No active work orders.</div>`}</div></section>`;
}

function countStatus(status) {
  return state.workOrders.filter((order) => order.status === status).length;
}

function countPriority(priority) {
  return state.workOrders.filter((order) => order.priority === priority).length;
}

function WorkOrderCard(order) {
  return `<button class="work-order-card ${priorityClass(order.priority)}" data-route="work-order-detail" data-id="${order.id}" type="button"><div class="card-line"><strong>${escapeHtml(order.id)}</strong><span class="badge-stack">${PriorityBadge(order.priority)}${StatusBadge(order.status)}</span></div><h3>${escapeHtml(order.vehicleType)} | ${escapeHtml(order.unitNumber)}</h3><p>${escapeHtml(order.problem)}</p><div class="card-meta"><span>${escapeHtml(order.customer || "No customer")}</span><span>${escapeHtml(order.serviceType)}</span><span>${escapeHtml(order.technician || "Unassigned")}</span></div><div class="card-line card-foot"><span>Due ${shortDate(order.dueDate)}</span><span>${money(orderTotal(order))}</span></div></button>`;
}

function PriorityBadge(priority = "Normal") {
  const key = String(priority).toLowerCase();
  return `<span class="priority-badge priority-${key}">${escapeHtml(priority)}</span>`;
}

function priorityClass(priority = "Normal") {
  return priority === "Urgent" || priority === "Roadside" ? "priority-card-hot" : "";
}

function WorkOrders() {
  const filtered = state.workOrders.filter((order) => {
    const haystack = [order.id, order.customer, order.unitNumber, order.vehicleType, order.serviceType, order.status, order.problem].join(" ").toLowerCase();
    return haystack.includes(orderQuery.toLowerCase()) && (orderStatus === "All" || order.status === orderStatus) && (orderPriority === "All" || order.priority === orderPriority);
  });
  return `
    <header class="topbar"><div><p class="eyebrow">Repair queue</p><h1>Work Orders</h1></div><div class="top-actions"><button class="secondary" data-action="email-intake" type="button">Create From Email</button><button class="primary-action" data-route="work-order-new" type="button">New Work Order</button></div></header>
    <section class="toolbar surface"><input id="orderSearch" type="search" value="${escapeHtml(orderQuery)}" placeholder="Search customer, unit, service, status" /><select id="orderStatusFilter">${["All", ...statuses].map((item) => `<option ${item === orderStatus ? "selected" : ""}>${item}</option>`).join("")}</select><select id="orderPriorityFilter">${["All", "Normal", "Urgent", "Roadside", "Fleet"].map((item) => `<option ${item === orderPriority ? "selected" : ""}>${item}</option>`).join("")}</select></section>
    <section class="card-grid work-order-grid">${filtered.map(WorkOrderCard).join("") || `<div class="empty-state">No matching work orders.</div>`}</section>
    <section class="table-wrap"><table><thead><tr><th>Order</th><th>Unit</th><th>Customer</th><th>Service</th><th>Priority</th><th>Status</th><th>Tech</th><th>Total</th><th>Updated</th></tr></thead><tbody>${filtered.map((order) => `<tr data-route="work-order-detail" data-id="${order.id}"><td><strong>${escapeHtml(order.id)}</strong></td><td>${escapeHtml(order.vehicleType)} | ${escapeHtml(order.unitNumber)}</td><td>${escapeHtml(order.customer)}</td><td>${escapeHtml(order.serviceType)}</td><td>${PriorityBadge(order.priority)}</td><td>${StatusBadge(order.status)}</td><td>${escapeHtml(order.technician || "Unassigned")}</td><td>${money(orderTotal(order))}</td><td>${shortDate(order.updatedAt)}</td></tr>`).join("")}</tbody></table></section>`;
}

function WorkOrderNew() {
  return `<header class="topbar"><div><p class="eyebrow">New repair job</p><h1>New Work Order</h1></div></header>${WorkOrderForm({ status: "Pending", priority: "Normal", serviceType: "Inspection", vehicleType: "Truck" })}`;
}

function WorkOrderDetail(order) {
  if (!order) return `<section class="empty-state">Work order not found.</section>`;
  return `
    <header class="topbar"><div><p class="eyebrow">Work order detail</p><h1>${escapeHtml(order.id)} | ${escapeHtml(order.vehicleType)} ${escapeHtml(order.unitNumber)}</h1></div><button class="secondary" data-route="work-orders" type="button">Back to Orders</button></header>
    <section class="detail-layout"><div class="panel"><div class="detail-head"><div><span class="badge-stack">${PriorityBadge(order.priority)}${StatusBadge(order.status)}</span><h2>${escapeHtml(order.problem)}</h2></div><strong>${money(orderTotal(order))}</strong></div><div class="detail-grid"><span><strong>Customer</strong>${escapeHtml(order.customer)}</span><span><strong>Service</strong>${escapeHtml(order.serviceType)}</span><span><strong>Technician</strong>${escapeHtml(order.technician || "Unassigned")}</span><span><strong>Priority</strong>${PriorityBadge(order.priority)}</span><span><strong>Due</strong>${shortDate(order.dueDate)}</span><span><strong>VIN / Plate</strong>${escapeHtml(order.vin || "Not listed")}</span></div><div class="line-items"><h3>Labor Line Items</h3>${lineItems(order.labor)}<h3>Parts Line Items</h3>${lineItems(order.parts)}<h3>Completion Notes</h3><p>${escapeHtml(order.completionNotes || "No completion notes yet.")}</p></div></div><aside class="panel activity-panel"><h2>Activity</h2>${(order.activity || []).map((item) => `<div class="activity-note">${escapeHtml(item)}</div>`).join("")}</aside></section>
    <section class="section-heading edit-heading"><h2>Edit Work Order</h2></section>${WorkOrderForm(order)}`;
}

function lineItems(items = []) {
  return items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<div class="empty-line">No line items listed.</div>`;
}

function WorkOrderForm(order = {}) {
  return `<form class="surface form-stack" id="workOrderForm"><input name="id" type="hidden" value="${escapeHtml(order.id || "")}" /><div class="form-grid">
    <label>Customer<input name="customer" required value="${escapeHtml(order.customer || "")}" /></label>
    <label>Vehicle<select name="vehicleId"><option value="">New or unlisted vehicle</option>${state.vehicles.map((vehicle) => `<option value="${vehicle.id}" ${vehicle.id === order.vehicleId ? "selected" : ""}>${escapeHtml(`${vehicle.type} | ${vehicle.unitNumber} | ${vehicle.customer}`)}</option>`).join("")}</select></label>
    <label>Type<select name="vehicleType"><option ${order.vehicleType === "Truck" ? "selected" : ""}>Truck</option><option ${order.vehicleType === "Trailer" ? "selected" : ""}>Trailer</option></select></label>
    <label>Unit #<input name="unitNumber" required value="${escapeHtml(order.unitNumber || "")}" /></label>
    <label>VIN / Plate<input name="vin" value="${escapeHtml(order.vin || "")}" /></label>
    <label>Mileage / Hours<input name="mileage" value="${escapeHtml(order.mileage || "")}" /></label>
    <label>Service<select name="serviceType">${serviceTypes.map((type) => `<option ${type === order.serviceType ? "selected" : ""}>${type}</option>`).join("")}</select></label>
    <label>Status<select name="status">${statuses.map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></label>
    <label>Priority<select name="priority">${["Normal", "Urgent", "Roadside", "Fleet"].map((priority) => `<option ${priority === order.priority ? "selected" : ""}>${priority}</option>`).join("")}</select></label>
    <label>Technician<input name="technician" value="${escapeHtml(order.technician || "")}" /></label>
    <label>Due Date<input name="dueDate" type="date" value="${escapeHtml(order.dueDate || "")}" /></label>
  </div>
  ${VoiceField("Reported Problem", "problem", order.problem || "", true)}
  <div class="form-grid two">
    ${VoiceField("Labor Line Items", "labor", (order.labor || []).join("\n"))}
    ${VoiceField("Parts Line Items", "parts", (order.parts || []).join("\n"))}
  </div>
  ${VoiceField("Completion Notes", "completionNotes", order.completionNotes || "")}
  <div class="form-grid compact"><label>Labor Hours<input name="laborHours" type="number" min="0" step="0.1" value="${order.laborHours || ""}" /></label><label>Labor Cost<input name="laborCost" type="number" min="0" step="0.01" value="${order.laborCost || ""}" /></label><label>Parts Cost<input name="partsCost" type="number" min="0" step="0.01" value="${order.partsCost || ""}" /></label></div><div class="form-actions">${order.id ? `<button class="danger" data-action="delete-order" data-id="${order.id}" type="button">Delete</button>` : "<span></span>"}<button class="secondary" data-route="work-orders" type="button">Cancel</button><button class="primary-action" type="submit">Save Work Order</button></div></form>`;
}

function VoiceField(label, name, value = "", required = false) {
  return `<label>${label}<div class="voice-field"><textarea name="${name}" ${required ? "required" : ""}>${escapeHtml(value)}</textarea><button class="voice-button" data-action="voice-input" data-target="${name}" type="button" title="Voice input">Voice</button></div></label>`;
}

function VehiclesPage() {
  const editingVehicle = state.vehicles.find((vehicle) => vehicle.id === editingVehicleId);
  return `<header class="topbar"><div><p class="eyebrow">Fleet files</p><h1>Truck & Trailer Files</h1></div><div class="top-actions"><button class="secondary" data-action="toggle-bulk" type="button">Bulk Update</button><button class="primary-action" data-action="new-vehicle" type="button">New File</button></div></header>${BulkUpdatePanel()}<section class="vehicle-layout"><div class="vehicle-list">${state.vehicles.map((vehicle) => { const jobs = state.workOrders.filter((order) => order.vehicleId === vehicle.id); return `<button class="vehicle-card" data-action="edit-vehicle" data-id="${vehicle.id}" type="button"><div class="card-line"><strong>${escapeHtml(vehicle.type)} | ${escapeHtml(vehicle.unitNumber)}</strong><span>${jobs.length} order${jobs.length === 1 ? "" : "s"}</span></div><p>${escapeHtml(vehicle.customer || "No customer listed")}</p><div class="vehicle-spec">${escapeHtml([vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "No make/model listed")}</div><div class="card-meta"><span>${escapeHtml(vehicle.vin || vehicle.plate || "No VIN/plate")}</span><span>${escapeHtml(vehicle.mileage || "No mileage")}</span><span>PM: ${escapeHtml(vehicle.nextPmDue || "Not set")}</span><span>${shortDate(vehicle.updatedAt)}</span></div></button>`; }).join("")}</div><aside class="vehicle-panel"><h2>${editingVehicle ? "Update File" : "Add File"}</h2>${VehicleForm(editingVehicle || { type: "Truck" })}</aside></section>`;
}

function BulkUpdatePanel() {
  return `<section class="panel bulk-panel" id="bulkPanel" hidden><div class="section-heading"><div><h2>Bulk Update Truck & Trailer Files</h2><p class="muted-copy">Choose a CSV file from this computer or paste one unit per line. Existing files update by Type + Unit #. New files are created.</p></div></div><form class="form-stack no-pad" id="bulkVehicleForm"><label>Import File<input id="bulkFileInput" type="file" accept=".csv,.txt,.xlsx,.xls" /></label><label>Bulk File Data<textarea name="bulkData" class="bulk-textarea" placeholder="Type, Unit #, Make, Model, Year, Customer, VIN, Plate, Mileage, Engine, DOT Date, Registration Date, Last Service, Next PM Due&#10;Truck, Unit 12, Freightliner, Cascadia, 2020, ABC Fleet, 3AK..., TX1234, 450000, DD15, 2026-05-01, 2026-06-01, 2026-04-15, 455000&#10;Trailer, Trailer 22, Utility, Reefer, 2019, ABC Fleet, 1UY..., TRL22, , , 2026-05-10, 2026-06-10, 2026-03-01, 2026-07-01"></textarea></label><div class="email-hint">CSV column order: Type, Unit #, Make, Model, Year, Customer, VIN, Plate, Mileage, Engine, DOT Date, Registration Date, Last Service, Next PM Due. If your file is Excel .xlsx, open it in Excel and save as CSV first.</div><div class="form-actions"><span id="bulkResult"></span><button class="secondary" data-action="toggle-bulk" type="button">Close</button><button class="primary-action" type="submit">Apply Bulk Update</button></div></form></section>`;
}

function EmailSetupPage() {
  return `<header class="topbar"><div><p class="eyebrow">Customer intake</p><h1>Email Setup</h1></div><button class="primary-action" data-action="email-intake" type="button">Create From Email</button></header>
    <section class="panel email-setup-panel">
      <h2>Repair Inbox Address</h2>
      <p class="muted-copy">Give this email address to customers for repair requests. When an email arrives, paste it into Create From Email to fill a work order. Automatic inbox reading needs a Gmail, Outlook, or server connection.</p>
      <form class="form-stack no-pad" id="settingsForm">
        <div class="form-grid two">
          <label>Shop Name<input name="shopName" value="${escapeHtml(settings.shopName || "")}" /></label>
          <label>Repair Email ID<input name="intakeEmail" type="email" required value="${escapeHtml(settings.intakeEmail || "")}" /></label>
        </div>
        <div class="email-address-card">
          <span>Customer sends repair requests to</span>
          <strong>${escapeHtml(settings.intakeEmail)}</strong>
        </div>
        <div class="email-template">
          <h3>Suggested Customer Email Format</h3>
          <pre>Customer: ABC Fleet
Unit: Freightliner 12
Reported Problem: All Freightliner related issues
Priority: urgent
Parts: 7-way plug
VIN/Plate: optional
Mileage: optional</pre>
        </div>
        <div class="form-actions"><span></span><a class="secondary link-button" href="mailto:${escapeHtml(settings.intakeEmail)}?subject=Repair%20Request">Test Email</a><button class="primary-action" type="submit">Save Email Setup</button></div>
      </form>
    </section>`;
}

function VehicleForm(vehicle = {}) {
  return `<form class="surface form-stack" id="vehicleForm"><input name="id" type="hidden" value="${escapeHtml(vehicle.id || "")}" /><div class="form-grid"><label>Type<select name="type"><option ${vehicle.type === "Truck" ? "selected" : ""}>Truck</option><option ${vehicle.type === "Trailer" ? "selected" : ""}>Trailer</option></select></label><label>Unit #<input name="unitNumber" required value="${escapeHtml(vehicle.unitNumber || "")}" /></label><label>Customer<input name="customer" value="${escapeHtml(vehicle.customer || "")}" /></label><label>Year<input name="year" value="${escapeHtml(vehicle.year || "")}" /></label><label>Make<input name="make" placeholder="Freightliner" value="${escapeHtml(vehicle.make || "")}" /></label><label>Model<input name="model" value="${escapeHtml(vehicle.model || "")}" /></label><label>Engine<input name="engine" value="${escapeHtml(vehicle.engine || "")}" /></label><label>VIN<input name="vin" value="${escapeHtml(vehicle.vin || "")}" /></label><label>Plate<input name="plate" value="${escapeHtml(vehicle.plate || "")}" /></label><label>Mileage / Hours<input name="mileage" value="${escapeHtml(vehicle.mileage || "")}" /></label><label>DOT Date<input name="dotDate" type="date" value="${escapeHtml(vehicle.dotDate || "")}" /></label><label>Registration Date<input name="registrationDate" type="date" value="${escapeHtml(vehicle.registrationDate || "")}" /></label><label>Last Service<input name="lastServiceDate" type="date" value="${escapeHtml(vehicle.lastServiceDate || "")}" /></label><label>Next PM Due<input name="nextPmDue" value="${escapeHtml(vehicle.nextPmDue || "")}" /></label></div><label>Truck / Trailer File Notes<textarea name="notes">${escapeHtml(vehicle.notes || "")}</textarea></label><div class="form-actions">${vehicle.id ? `<button class="danger" data-action="delete-vehicle" data-id="${vehicle.id}" type="button">Delete</button>` : "<span></span>"}<button class="secondary" data-action="close-panel" type="button">Cancel</button><button class="primary-action" type="submit">Save File</button></div></form>`;
}

function EmailDialog() {
  return `<dialog id="emailDialog"><form class="surface form-stack dialog-form" id="emailForm"><div class="dialog-head"><div><p class="eyebrow">Email intake</p><h2>Create Work Order From Email</h2></div><button class="icon-button" data-action="close-email" type="button" aria-label="Close">x</button></div><label>Email Subject<input id="emailSubject" placeholder="Urgent repair needed for Freightliner Unit 12" /></label><label>Email Message<div class="voice-field"><textarea id="emailBody" class="email-body" placeholder="Customer: ABC Fleet&#10;Unit: Freightliner 12&#10;Reported Problem: all the Freightliner related issues&#10;Priority: urgent&#10;Parts: 7-way plug"></textarea><button class="voice-button" data-action="voice-input" data-target="emailBody" type="button" title="Voice input">Voice</button></div></label><div class="email-hint">Helpful labels: Customer, Unit, Truck, Trailer, Reported Problem, Priority, Tech, Parts, VIN, Mileage, Service.</div><div class="form-actions"><span></span><button class="secondary" type="button" data-action="close-email">Cancel</button><button class="primary-action" type="submit">Fill Work Order</button></div></form></dialog>`;
}

document.addEventListener("click", (event) => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    route = { page: routeTarget.dataset.route, id: routeTarget.dataset.id || "" };
    render();
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === "email-intake") document.querySelector("#emailDialog").showModal();
  if (action === "close-email") document.querySelector("#emailDialog").close();
  if (action === "voice-input") startVoiceInput(actionTarget);
  if (action === "delete-order" && window.confirm(`Delete ${actionTarget.dataset.id}?`)) {
    state.workOrders = state.workOrders.filter((order) => order.id !== actionTarget.dataset.id);
    saveState();
    route = { page: "work-orders" };
    render();
  }
  if (action === "new-vehicle") {
    editingVehicleId = "";
    render();
  }
  if (action === "toggle-bulk") {
    const panel = document.querySelector("#bulkPanel");
    if (panel) panel.hidden = !panel.hidden;
  }
  if (action === "edit-vehicle") {
    editingVehicleId = actionTarget.dataset.id;
    render();
  }
  if (action === "close-panel") {
    editingVehicleId = "";
    render();
  }
  if (action === "delete-vehicle" && window.confirm("Delete this vehicle record? Work orders will stay saved.")) {
    state.vehicles = state.vehicles.filter((vehicle) => vehicle.id !== actionTarget.dataset.id);
    state.workOrders = state.workOrders.map((order) => order.vehicleId === actionTarget.dataset.id ? { ...order, vehicleId: "" } : order);
    saveState();
    editingVehicleId = "";
    render();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "orderSearch") {
    orderQuery = event.target.value;
    render();
    const search = document.querySelector("#orderSearch");
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "orderStatusFilter") {
    orderStatus = event.target.value;
    render();
  }
  if (event.target.id === "orderPriorityFilter") {
    orderPriority = event.target.value;
    render();
  }
});

function bindForms() {
  const workOrderForm = document.querySelector("#workOrderForm");
  if (workOrderForm) {
    workOrderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(workOrderForm).entries());
      const vehicle = state.vehicles.find((item) => item.id === data.vehicleId);
      const saved = upsertWorkOrder({ ...data, vehicleType: (vehicle && vehicle.type) || data.vehicleType, unitNumber: (vehicle && vehicle.unitNumber) || data.unitNumber, vin: (vehicle && vehicle.vin) || data.vin, mileage: (vehicle && vehicle.mileage) || data.mileage, customer: data.customer || (vehicle && vehicle.customer) || "" });
      route = { page: "work-order-detail", id: saved.id };
      render();
    });
  }

  const vehicleForm = document.querySelector("#vehicleForm");
  if (vehicleForm) {
    vehicleForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const saved = upsertVehicle(Object.fromEntries(new FormData(vehicleForm).entries()));
      editingVehicleId = saved.id;
      render();
    });
  }

  const bulkVehicleForm = document.querySelector("#bulkVehicleForm");
  if (bulkVehicleForm) {
    bulkVehicleForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const bulkData = new FormData(bulkVehicleForm).get("bulkData");
      const result = bulkUpdateVehicles(bulkData);
      render();
      const panel = document.querySelector("#bulkPanel");
      if (panel) panel.hidden = false;
      const resultTarget = document.querySelector("#bulkResult");
      if (resultTarget) resultTarget.textContent = `${result.updated} updated, ${result.created} created`;
    });
  }

  const bulkFileInput = document.querySelector("#bulkFileInput");
  if (bulkFileInput) {
    bulkFileInput.addEventListener("change", importBulkFile);
  }

  const settingsForm = document.querySelector("#settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      settings = Object.fromEntries(new FormData(settingsForm).entries());
      saveSettings();
      render();
    });
  }

  const emailForm = document.querySelector("#emailForm");
  if (emailForm) {
    emailForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const parsed = parseEmailWorkOrder(document.querySelector("#emailSubject").value, document.querySelector("#emailBody").value);
      document.querySelector("#emailDialog").close();
      route = { page: "work-order-new" };
      render();
      fillWorkOrderForm(parsed);
    });
  }
}

function fillWorkOrderForm(data) {
  const form = document.querySelector("#workOrderForm");
  Object.entries(data).forEach(([key, value]) => {
    const field = form && form.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function parseEmailWorkOrder(subject, body) {
  const text = `${subject}\n${body}`.trim();
  const get = (...labels) => {
    for (const label of labels) {
      const match = text.match(new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im"));
      if (match) return match[1].trim();
    }
    return "";
  };
  const subjectUnit = subject.match(/\b(truck|trailer|unit)\s*#?\s*([a-z0-9-]+)/i);
  const unitNumber = get("unit", "unit number", "unit #", "truck", "trailer") || (subjectUnit ? `${subjectUnit[1]} ${subjectUnit[2]}` : "");
  const combinedUnit = `${get("type", "unit type")} ${unitNumber} ${subject}`.toLowerCase();
  const problem =
    get("reported problem", "problem", "issue", "repair", "request", "concern", "complaint", "description") ||
    body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => !line.includes(":")) ||
    subject;
  return {
    customer: get("customer", "company", "fleet", "from"),
    vehicleType: combinedUnit.includes("trailer") ? "Trailer" : "Truck",
    unitNumber,
    vin: get("vin", "plate", "license"),
    mileage: get("mileage", "miles", "hours"),
    serviceType: get("service", "service type") || "Other",
    technician: get("tech", "technician", "assigned to"),
    priority: parsePriority(get("priority", "urgency") || text),
    problem,
    parts: get("parts", "part"),
    labor: get("task", "tasks", "labor"),
  };
}

function parsePriority(value) {
  const text = value.toLowerCase();
  if (text.includes("roadside")) return "Roadside";
  if (text.includes("urgent") || text.includes("asap") || text.includes("emergency")) return "Urgent";
  if (text.includes("fleet")) return "Fleet";
  return "Normal";
}

function startVoiceInput(button) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    window.alert("Voice input is not supported in this browser. Try Chrome or Edge.");
    return;
  }

  const targetName = button.dataset.target;
  const form = button.closest("form") || document;
  const target = form.elements?.namedItem(targetName) || document.querySelector(`#${targetName}`);
  if (!target) return;

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  button.classList.add("listening");
  button.textContent = "Listening";

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ")
      .trim();
    const spacer = target.value.trim() ? "\n" : "";
    target.value = `${target.value}${spacer}${transcript}`;
    target.dispatchEvent(new Event("input", { bubbles: true }));
  };

  recognition.onerror = () => {
    window.alert("Voice input stopped. Please check microphone permission and try again.");
  };

  recognition.onend = () => {
    button.classList.remove("listening");
    button.textContent = "Voice";
  };

  recognition.start();
}

function bulkUpdateVehicles(rawData = "") {
  const rows = rawData
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);

  let created = 0;
  let updated = 0;

  rows.forEach((row, index) => {
    if (index === 0 && String(row[0] || "").toLowerCase() === "type") return;
    const [type, unitNumber, make, model, year, customer, vin, plate, mileage, engine, dotDate, registrationDate, lastServiceDate, nextPmDue] = row;
    if (!unitNumber) return;
    const normalizedType = String(type || "Truck").toLowerCase().includes("trailer") ? "Trailer" : "Truck";
    const existing = state.vehicles.find(
      (vehicle) =>
        vehicle.type === normalizedType &&
        vehicle.unitNumber.toLowerCase() === String(unitNumber).trim().toLowerCase(),
    );
    upsertVehicle({
      ...(existing || {}),
      type: normalizedType,
      unitNumber: String(unitNumber || "").trim(),
      make: make || existing?.make || "",
      model: model || existing?.model || "",
      year: year || existing?.year || "",
      customer: customer || existing?.customer || "",
      vin: vin || existing?.vin || "",
      plate: plate || existing?.plate || "",
      mileage: mileage || existing?.mileage || "",
      engine: engine || existing?.engine || "",
      dotDate: dotDate || existing?.dotDate || "",
      registrationDate: registrationDate || existing?.registrationDate || "",
      lastServiceDate: lastServiceDate || existing?.lastServiceDate || "",
      nextPmDue: nextPmDue || existing?.nextPmDue || "",
    });
    if (existing) updated += 1;
    else created += 1;
  });

  saveState();
  return { created, updated };
}

function importBulkFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const extension = file.name.split(".").pop().toLowerCase();
  const textarea = document.querySelector('#bulkVehicleForm textarea[name="bulkData"]');
  const resultTarget = document.querySelector("#bulkResult");

  if (extension === "xlsx" || extension === "xls") {
    if (resultTarget) resultTarget.textContent = "Excel file selected. Please save it as CSV, then import the CSV file.";
    window.alert("Excel files need to be saved as CSV first, then imported here.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (textarea) textarea.value = String(reader.result || "");
    if (resultTarget) resultTarget.textContent = `Loaded ${file.name}`;
  };
  reader.onerror = () => {
    if (resultTarget) resultTarget.textContent = "Could not read file.";
  };
  reader.readAsText(file);
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
}

render();
