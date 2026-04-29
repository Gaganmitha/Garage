import { createVehicle } from "../entities/Vehicle.js";
import { createWorkOrder } from "../entities/WorkOrder.js";

const STORE_KEY = "garage-desk-state-v2";
const LEGACY_KEY = "truck-repair-work-orders";

const seedVehicles = [
  createVehicle({
    id: "VEH-1",
    type: "Truck",
    unitNumber: "Unit 42",
    plate: "NYF-421",
    customer: "North Yard Fleet",
    mileage: "186,240",
    notes: "Air brake issue reported during morning dispatch.",
  }),
  createVehicle({
    id: "VEH-2",
    type: "Trailer",
    unitNumber: "Trailer 7",
    vin: "VIN ending 8831",
    customer: "Hillside Hauling",
    mileage: "94,010",
    notes: "Hydraulic lift trailer.",
  }),
];

const seedWorkOrders = [
  createWorkOrder({
    id: "WO-1001",
    vehicleId: "VEH-1",
    vehicleType: "Truck",
    unitNumber: "Unit 42",
    customer: "North Yard Fleet",
    vin: "Plate NYF-421",
    mileage: "186,240",
    serviceType: "Brakes",
    problem: "Air brake pressure dropping overnight.",
    labor: ["Inspect air lines", "Check fittings", "Replace leaking chamber if confirmed"],
    parts: ["Brake chamber ordered from local supplier"],
    status: "Awaiting Parts",
    priority: "Urgent",
    technician: "Mike",
    laborHours: 1.5,
    laborCost: 180,
    partsCost: 145,
  }),
  createWorkOrder({
    id: "WO-1002",
    vehicleId: "VEH-2",
    vehicleType: "Trailer",
    unitNumber: "Trailer 7",
    customer: "Hillside Hauling",
    vin: "VIN ending 8831",
    mileage: "94,010",
    serviceType: "Hydraulics",
    problem: "Hydraulic leak near lift cylinder.",
    labor: ["Clean area", "Pressure test", "Replace hose assembly"],
    parts: ["Hydraulic hose assembly in stock"],
    status: "In Progress",
    priority: "Normal",
    technician: "Ana",
    laborHours: 2,
    laborCost: 240,
    partsCost: 96,
  }),
];

let state = loadState();

export function getState() {
  return state;
}

export function saveState(nextState = state) {
  state = nextState;
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function upsertVehicle(vehicle) {
  const normalized = createVehicle(vehicle);
  const index = state.vehicles.findIndex((item) => item.id === normalized.id);
  if (index >= 0) state.vehicles[index] = normalized;
  else state.vehicles.unshift(normalized);
  saveState();
  return normalized;
}

export function upsertWorkOrder(order) {
  const existingIds = state.workOrders.map((item) => item.id);
  const normalized = createWorkOrder({ ...order, existingIds });
  const existing = state.workOrders.find((item) => item.id === normalized.id);
  if (existing) {
    normalized.activity = [
      `Updated ${new Date().toLocaleString()}`,
      ...existing.activity.filter((item) => !item.startsWith("Updated")).slice(0, 7),
    ];
  }

  const index = state.workOrders.findIndex((item) => item.id === normalized.id);
  if (index >= 0) state.workOrders[index] = normalized;
  else state.workOrders.unshift(normalized);

  const vehicle = ensureVehicleFromOrder(normalized);
  normalized.vehicleId = vehicle.id;
  saveState();
  return normalized;
}

export function deleteWorkOrder(id) {
  state.workOrders = state.workOrders.filter((order) => order.id !== id);
  saveState();
}

export function deleteVehicle(id) {
  state.vehicles = state.vehicles.filter((vehicle) => vehicle.id !== id);
  state.workOrders = state.workOrders.map((order) =>
    order.vehicleId === id ? { ...order, vehicleId: "" } : order,
  );
  saveState();
}

function ensureVehicleFromOrder(order) {
  const existing =
    state.vehicles.find((vehicle) => vehicle.id === order.vehicleId) ||
    state.vehicles.find(
      (vehicle) =>
        vehicle.unitNumber.toLowerCase() === order.unitNumber.toLowerCase() &&
        vehicle.type === order.vehicleType,
    );

  const vehicle = createVehicle({
    ...(existing || {}),
    id: existing?.id,
    type: order.vehicleType,
    unitNumber: order.unitNumber,
    vin: order.vin,
    customer: order.customer,
    mileage: order.mileage,
  });

  const index = state.vehicles.findIndex((item) => item.id === vehicle.id);
  if (index >= 0) state.vehicles[index] = vehicle;
  else state.vehicles.unshift(vehicle);
  return vehicle;
}

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
      return migrateLegacy(JSON.parse(legacy));
    } catch {
      return freshState();
    }
  }

  return freshState();
}

function freshState() {
  return {
    vehicles: seedVehicles,
    workOrders: seedWorkOrders,
  };
}

function migrateLegacy(orders) {
  const vehicles = [];
  const workOrders = orders.map((order, index) => {
    const vehicle = createVehicle({
      id: `VEH-L${index + 1}`,
      type: order.unitType || "Truck",
      unitNumber: order.truck || "",
      vin: order.vin || "",
      customer: order.customer || "",
      mileage: order.mileage || "",
    });
    vehicles.push(vehicle);
    return createWorkOrder({
      id: order.id,
      vehicleId: vehicle.id,
      vehicleType: vehicle.type,
      unitNumber: vehicle.unitNumber,
      vin: order.vin,
      mileage: order.mileage,
      customer: order.customer,
      serviceType: "Other",
      problem: order.problem,
      status: order.status,
      priority: order.priority,
      technician: order.technician,
      dueDate: order.dueDate,
      parts: order.parts,
      labor: order.tasks,
      completionNotes: order.completion,
      laborHours: order.laborHours,
      laborCost: order.laborCost,
      partsCost: order.partsCost,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  });

  const migrated = { vehicles, workOrders };
  localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
  return migrated;
}
