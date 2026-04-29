export const workOrderStatuses = [
  "Pending",
  "In Progress",
  "Awaiting Parts",
  "Awaiting Approval",
  "On Hold",
  "Ready for Review",
  "Completed",
  "Closed / Invoiced",
];

export const serviceTypes = [
  "Inspection",
  "Brakes",
  "Electrical",
  "Engine",
  "Hydraulics",
  "Tires",
  "Trailer Body",
  "Preventive Maintenance",
  "Other",
];

export function createWorkOrder(data = {}) {
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

export function textToLines(value = "") {
  if (Array.isArray(value)) return value;
  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function nextWorkOrderId(existingIds) {
  const numbers = existingIds.map((id) => Number(String(id).replace("WO-", ""))).filter(Boolean);
  const next = numbers.length ? Math.max(...numbers) + 1 : 1001;
  return `WO-${next}`;
}

export function orderTotal(order) {
  return Number(order.laborCost || 0) + Number(order.partsCost || 0);
}
