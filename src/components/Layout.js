export function Layout({ activePage, content }) {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <img class="brand-logo" src="assets/garage-desk-logo.svg" alt="Nationwide Logistics Inc logo" />
          <div>
            <strong>Nationwide Logistics Inc</strong>
            <span>Truck & trailer repair</span>
          </div>
        </div>
        <nav class="nav-tabs">
          ${navButton("dashboard", "Dashboard", activePage)}
          ${navButton("work-orders", "Work Orders", activePage)}
          ${navButton("vehicles", "Vehicles", activePage)}
        </nav>
      </aside>
      <main class="main">${content}</main>
    </div>
  `;
}

function navButton(route, label, activePage) {
  return `
    <button class="nav-tab ${activePage === route ? "active" : ""}" data-route="${route}" type="button">
      ${label}
    </button>
  `;
}
