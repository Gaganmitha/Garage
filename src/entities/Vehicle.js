export const vehicleTypes = ["Truck", "Trailer"];

export function createVehicle(data = {}) {
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

export function vehicleLabel(vehicle) {
  return `${vehicle.type || "Truck"} ${vehicle.unitNumber || ""}`.trim();
}
