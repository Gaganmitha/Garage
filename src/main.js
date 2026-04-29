import { Layout } from "./components/Layout.js";
import { Dashboard } from "./pages/Dashboard.js";
import { WorkOrders } from "./pages/WorkOrders.js";
import { WorkOrderDetail } from "./pages/WorkOrderDetail.js";
import { Vehicles } from "./pages/Vehicles.js";
import { getState, upsertWorkOrder, deleteWorkOrder, upsertVehicle, deleteVehicle } from "./data/store.js";
import { orderFromForm } from "./components/WorkOrderForm.js";

const app = document.querySelector("#app");

let route = { page: "dashboard" };
let orderQuery = "";
let orderStatus = "All";
let editingVehicleId = "";

function render() {
  const state = getState();
  const content = pageContent(state);
  app.innerHTML = Layout({ activePage: activePageName(), content }) + EmailDialog();
  bindForms();
}

function activePageName() {
  if (route.page === "work-order-detail" || route.page === "work-order-new") return "work-orders";
  return route.page;
}

function pageContent(state) {
  if (route.page === "work-orders") {
    return WorkOrders({ workOrders: state.workOrders, query: orderQuery, status: orderStatus });
  }

  if (route.page === "work-order-detail") {
    const order = state.workOrders.find((item) => item.id === route.id);
    return WorkOrderDetail({ order, vehicles: state.vehicles });
  }

  if (route.page === "work-order-new") {
    return WorkOrderDetail({ vehicles: state.vehicles, isNew: true });
  }

  if (route.page === "vehicles") {
    const editingVehicle = state.vehicles.find((vehicle) => vehicle.id === editingVehicleId);
    return Vehicles({ vehicles: state.vehicles, workOrders: state.workOrders, editingVehicle });
  }

  return Dashboard(state);
}

function navigate(page, id = "") {
  route = { page, id };
  render();
}

document.addEventListener("click", (event) => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    navigate(routeTarget.dataset.route, routeTarget.dataset.id || "");
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;

  if (action === "email-intake") openEmailDialog();
  if (action === "delete-order") removeOrder(actionTarget.dataset.id);
  if (action === "new-vehicle") {
    editingVehicleId = "";
    render();
  }
  if (action === "edit-vehicle") {
    editingVehicleId = actionTarget.dataset.id;
    render();
  }
  if (action === "close-panel") {
    editingVehicleId = "";
    render();
  }
  if (action === "delete-vehicle") removeVehicle(actionTarget.dataset.id);
});

document.addEventListener("input", (event) => {
  if (event.target.id === "orderSearch") {
    orderQuery = event.target.value;
    render();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "orderStatusFilter") {
    orderStatus = event.target.value;
    render();
  }
});

function bindForms() {
  const workOrderForm = document.querySelector("#workOrderForm");
  if (workOrderForm) {
    workOrderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const state = getState();
      const vehicleId = new FormData(workOrderForm).get("vehicleId");
      const vehicle = state.vehicles.find((item) => item.id === vehicleId);
      const saved = upsertWorkOrder(orderFromForm(workOrderForm, vehicle));
      navigate("work-order-detail", saved.id);
    });
  }

  const vehicleForm = document.querySelector("#vehicleForm");
  if (vehicleForm) {
    vehicleForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(vehicleForm).entries());
      const saved = upsertVehicle(data);
      editingVehicleId = saved.id;
      render();
    });
  }

  const emailForm = document.querySelector("#emailForm");
  if (emailForm) {
    emailForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const parsed = parseEmailWorkOrder(
        document.querySelector("#emailSubject").value,
        document.querySelector("#emailBody").value,
      );
      closeEmailDialog();
      route = { page: "work-order-new" };
      render();
      fillWorkOrderForm(parsed);
    });
  }
}

function removeOrder(id) {
  if (!window.confirm(`Delete ${id}?`)) return;
  deleteWorkOrder(id);
  navigate("work-orders");
}

function removeVehicle(id) {
  if (!window.confirm("Delete this vehicle record? Work orders will stay saved.")) return;
  deleteVehicle(id);
  editingVehicleId = "";
  render();
}

function EmailDialog() {
  return `
    <dialog id="emailDialog">
      <form class="surface form-stack dialog-form" id="emailForm">
        <div class="dialog-head">
          <div>
            <p class="eyebrow">Email intake</p>
            <h2>Create Work Order From Email</h2>
          </div>
          <button class="icon-button" data-action="close-email" type="button" aria-label="Close">x</button>
        </div>
        <label>Email Subject<input id="emailSubject" placeholder="Urgent repair needed for Freightliner Unit 12" /></label>
        <label>Email Message<textarea id="emailBody" class="email-body" placeholder="Customer: ABC Fleet&#10;Unit: Freightliner 12&#10;Reported Problem: all the Freightliner related issues&#10;Priority: urgent&#10;Parts: 7-way plug"></textarea></label>
        <div class="email-hint">Helpful labels: Customer, Unit, Truck, Trailer, Reported Problem, Priority, Tech, Parts, VIN, Mileage, Service.</div>
        <div class="form-actions">
          <span></span>
          <button class="secondary" type="button" data-action="close-email">Cancel</button>
          <button class="primary-action" type="submit">Fill Work Order</button>
        </div>
      </form>
    </dialog>
  `;
}

document.addEventListener("click", (event) => {
  if (event.target.closest('[data-action="close-email"]')) closeEmailDialog();
});

function openEmailDialog() {
  const dialog = document.querySelector("#emailDialog");
  dialog?.showModal();
}

function closeEmailDialog() {
  const dialog = document.querySelector("#emailDialog");
  dialog?.close();
}

function fillWorkOrderForm(data) {
  const form = document.querySelector("#workOrderForm");
  if (!form) return;
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
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
  const labeledUnit = get("unit", "unit number", "unit #", "truck", "trailer");
  const unitNumber = labeledUnit || (subjectUnit ? `${subjectUnit[1]} ${subjectUnit[2]}` : "");
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

render();
