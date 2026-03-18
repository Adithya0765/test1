const healthBadge = document.getElementById("healthBadge");
const marketplaceList = document.getElementById("marketplaceList");
const installedList = document.getElementById("installedList");
const simulatorsList = document.getElementById("simulatorsList");
const viewsList = document.getElementById("viewsList");
const handoffSummary = document.getElementById("handoffSummary");
const frontendTasksList = document.getElementById("frontendTasksList");
const backendTasksList = document.getElementById("backendTasksList");
const backendSelect = document.getElementById("backendSelect");
const circuitInput = document.getElementById("circuitInput");
const configInput = document.getElementById("configInput");
const runSimulationBtn = document.getElementById("runSimulationBtn");
const simulationOutput = document.getElementById("simulationOutput");
const simViz = document.getElementById("simViz");
const metricGrid = document.getElementById("metricGrid");
const observableBars = document.getElementById("observableBars");
const diagnosticsList = document.getElementById("diagnosticsList");
const fidelityFill = document.getElementById("fidelityFill");
const fidelityLabel = document.getElementById("fidelityLabel");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function cardTemplate(title, body, actions = "") {
  return `
    <div class="card">
      <h4>${title}</h4>
      ${body}
      <div class="actions">${actions}</div>
    </div>
  `;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatPercent(value) {
  return `${(safeNumber(value) * 100).toFixed(2)}%`;
}

function renderSimulationVisualization(payload) {
  const result = payload?.result || {};
  const metrics = result.metrics || {};
  const observables = result.observables || {};
  const diagnostics = Array.isArray(result.diagnostics) ? result.diagnostics : [];

  simViz.classList.remove("hidden");

  metricGrid.innerHTML = [
    {
      label: "Run ID",
      value: result.runId || "-"
    },
    {
      label: "Backend",
      value: result.backendId || payload.backendId || "-"
    },
    {
      label: "Duration",
      value: `${safeNumber(metrics.durationMs)} ms`
    },
    {
      label: "Peak Memory",
      value: `${safeNumber(metrics.peakMemoryMb)} MB`
    },
    {
      label: "Fidelity",
      value: typeof metrics.fidelityEstimate === "number" ? formatPercent(metrics.fidelityEstimate) : "-"
    }
  ]
    .map(
      (item) => `
      <div class="metric-card">
        <div class="label">${item.label}</div>
        <div class="value">${item.value}</div>
      </div>
    `
    )
    .join("");

  const keys = Object.keys(observables);
  if (!keys.length) {
    observableBars.innerHTML = '<div class="diag-item">No observables returned.</div>';
  } else {
    observableBars.innerHTML = keys
      .map((key) => {
        const val = safeNumber(observables[key]);
        const width = Math.min(100, Math.abs(val) * 100);
        return `
          <div class="bar-row">
            <div class="bar-label">${key}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${width}%"></div>
            </div>
            <div class="bar-value">${val.toFixed(3)}</div>
          </div>
        `;
      })
      .join("");
  }

  const fidelity = Math.max(0, Math.min(1, safeNumber(metrics.fidelityEstimate, 0)));
  fidelityFill.style.width = `${(fidelity * 100).toFixed(2)}%`;
  fidelityLabel.textContent = formatPercent(fidelity);

  diagnosticsList.innerHTML = diagnostics.length
    ? diagnostics
        .map(
          (d) =>
            `<div class="diag-item ${d.level || "info"}"><strong>${(d.level || "info").toUpperCase()}</strong> ${d.message || ""}</div>`
        )
        .join("")
    : '<div class="diag-item">No diagnostics.</div>';
}

async function loadHealth() {
  try {
    const data = await api("/api/health");
    healthBadge.textContent = data.ok ? "System Healthy" : "System Issue";
  } catch (_error) {
    healthBadge.textContent = "Health Check Failed";
  }
}

async function loadMarketplace() {
  const data = await api("/api/marketplace/extensions");
  marketplaceList.innerHTML = data.items
    .map((item) =>
      cardTemplate(
        item.displayName,
        `<p>${item.description}</p>
         <div class="meta"><span>${item.category}</span><span>Rating ${item.rating}</span><span>${item.downloads} downloads</span></div>`,
        `<button data-action="install" data-id="${item.id}">Install</button>`
      )
    )
    .join("");
}

function taskTemplate(title, sub) {
  return `
    <div class="task-item">
      <div class="title">${title}</div>
      <div class="sub">${sub}</div>
    </div>
  `;
}

async function loadHandoffDashboard() {
  const handoff = await api("/api/integrations/handoff");
  const matrix = await api("/api/integrations/matrix");

  const totals = handoff.bundle.totals;
  handoffSummary.innerHTML = [
    { k: "Extensions", v: totals.extensions },
    { k: "Simulation Extensions", v: totals.simulationExtensions },
    { k: "Frontend Adapters", v: totals.frontendAdapters },
    { k: "Backend Bridges", v: totals.backendBridges },
    { k: "Matrix Entries", v: matrix.items.length }
  ]
    .map((item) => cardTemplate(item.k, `<p>${item.v}</p>`))
    .join("");

  frontendTasksList.innerHTML = handoff.bundle.frontend
    .map((entry) =>
      taskTemplate(
        `${entry.displayName}`,
        `Adapter: ${entry.frontendAdapterPath} | Commands: ${entry.commandCount}`
      )
    )
    .join("");

  backendTasksList.innerHTML = handoff.bundle.backend
    .map((entry) =>
      taskTemplate(
        `${entry.displayName}`,
        `Bridge: ${entry.backendHeaderPath} | Simulation bridge: ${entry.needsSimulationBridge ? "required" : "optional"}`
      )
    )
    .join("");
}

async function loadInstalled() {
  const installed = await api("/api/extensions/installed");
  const sims = await api("/api/simulators");
  const views = await api("/api/views");

  const activeSet = new Set(installed.active);

  installedList.innerHTML = installed.items.length
    ? installed.items
        .map((item) => {
          const isActive = activeSet.has(item.id);
          return cardTemplate(
            item.name,
            `<p>${item.publisher} · v${item.version}</p><div class="meta"><span>${isActive ? "Active" : "Inactive"}</span></div>`,
            `${
              isActive
                ? `<button class="secondary" data-action="deactivate" data-id="${item.id}">Deactivate</button>`
                : `<button data-action="activate" data-id="${item.id}">Activate</button>`
            }
             <button class="secondary" data-action="uninstall" data-id="${item.id}">Uninstall</button>`
          );
        })
        .join("")
    : '<div class="card"><p>No extensions installed.</p></div>';

  simulatorsList.innerHTML = sims.items.length
    ? sims.items
        .map((sim) =>
          cardTemplate(
            sim.name,
            `<div class="meta"><span>${sim.id}</span><span>${sim.extensionId}</span></div>`,
            ""
          )
        )
        .join("")
    : '<div class="card"><p>No active simulator backends.</p></div>';

  viewsList.innerHTML = views.items.length
    ? views.items
        .map((view) =>
          cardTemplate(
            view.title,
            `<div class="meta"><span>${view.id}</span><span>${view.location}</span><span>${view.extensionId}</span></div>`,
            ""
          )
        )
        .join("")
    : '<div class="card"><p>No active extension views.</p></div>';

  backendSelect.innerHTML = sims.items
    .map((sim) => `<option value="${sim.id}">${sim.name} (${sim.id})</option>`)
    .join("");
}

async function handleAction(action, id) {
  const payload = JSON.stringify({ id });

  if (action === "install") {
    await api("/api/extensions/install", { method: "POST", body: payload });
  }
  if (action === "uninstall") {
    await api("/api/extensions/uninstall", { method: "POST", body: payload });
  }
  if (action === "activate") {
    await api("/api/extensions/activate", { method: "POST", body: payload });
  }
  if (action === "deactivate") {
    await api("/api/extensions/deactivate", { method: "POST", body: payload });
  }

  await loadInstalled();
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");

  try {
    await handleAction(action, id);
  } catch (error) {
    alert(error.message);
  }
});

runSimulationBtn.addEventListener("click", async () => {
  const backendId = backendSelect.value;

  if (!backendId) {
    simulationOutput.textContent = "No simulator available. Install and activate one first.";
    return;
  }

  try {
    const circuit = JSON.parse(circuitInput.value);
    const config = JSON.parse(configInput.value);
    simulationOutput.textContent = "Running simulation...";

    const result = await api("/api/simulate", {
      method: "POST",
      body: JSON.stringify({ backendId, circuit, config })
    });

    renderSimulationVisualization(result);
    simulationOutput.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    simulationOutput.textContent = `Simulation failed: ${error.message}`;
  }
});

async function boot() {
  await loadHealth();
  await loadHandoffDashboard();
  await loadMarketplace();
  await loadInstalled();
}

boot().catch((error) => {
  simulationOutput.textContent = `Startup error: ${error.message}`;
});
