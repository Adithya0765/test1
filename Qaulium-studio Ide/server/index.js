const path = require("path");
const express = require("express");
const { ExtensionRegistry } = require("./core/extensionRegistry");
const { LifecycleManager } = require("./core/lifecycleManager");
const { IntegrationRegistry } = require("./core/integrationRegistry");

const rootDir = path.resolve(__dirname, "..");
const extensionsRoot = path.join(rootDir, "extensions");
const dataDir = path.join(__dirname, "data");

const registry = new ExtensionRegistry({
  extensionsRoot,
  marketplacePath: path.join(dataDir, "marketplace.json"),
  installedPath: path.join(dataDir, "installed.json")
});

const lifecycle = new LifecycleManager({ extensionsRoot });
const integrations = new IntegrationRegistry({ rootDir });

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(rootDir, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "qaulium-studio" });
});

app.get("/api/core/features", (_req, res) => {
  res.json({
    core: [
      "circuit-builder",
      "monaco-editor",
      "workspace",
      "debugger",
      "state-vector-simulator",
      "hardware-execution-interface",
      "file-system",
      "auth-session"
    ]
  });
});

app.get("/api/marketplace/extensions", (_req, res) => {
  res.json({ items: registry.getMarketplace() });
});

app.get("/api/extensions/installed", (_req, res) => {
  res.json({ items: registry.listInstalled(), active: lifecycle.listActive() });
});

app.post("/api/extensions/install", (req, res) => {
  const { id } = req.body || {};
  const result = registry.installById(id);
  if (!result.ok) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.post("/api/extensions/uninstall", async (req, res) => {
  const { id } = req.body || {};
  if (lifecycle.listActive().includes(id)) {
    await lifecycle.deactivate(id);
  }

  const result = registry.uninstallById(id);
  if (!result.ok) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.post("/api/extensions/activate", async (req, res) => {
  const { id } = req.body || {};
  if (!registry.isInstalled(id)) {
    return res.status(400).json({ ok: false, message: "Install extension first" });
  }

  const result = await lifecycle.activate(id);
  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json({
    ...result,
    simulators: lifecycle.listSimulators(),
    views: lifecycle.listViews()
  });
});

app.post("/api/extensions/deactivate", async (req, res) => {
  const { id } = req.body || {};
  const result = await lifecycle.deactivate(id);
  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json({
    ...result,
    simulators: lifecycle.listSimulators(),
    views: lifecycle.listViews()
  });
});

app.get("/api/simulators", (_req, res) => {
  res.json({ items: lifecycle.listSimulators() });
});

app.get("/api/views", (_req, res) => {
  res.json({ items: lifecycle.listViews() });
});

app.get("/api/integrations/matrix", (_req, res) => {
  res.json({ items: integrations.listMatrix() });
});

app.get("/api/integrations/extension/:id", (req, res) => {
  const result = integrations.getExtensionCompatibility(req.params.id);
  if (!result) {
    return res.status(404).json({ ok: false, message: "Compatibility profile not found" });
  }
  return res.json({ ok: true, ...result });
});

app.get("/api/integrations/handoff", (_req, res) => {
  res.json({ ok: true, bundle: integrations.buildHandoffBundle() });
});

app.post("/api/simulate", async (req, res) => {
  const { backendId, circuit, config } = req.body || {};
  const result = await lifecycle.runSimulation(backendId, circuit, config);
  if (!result.ok) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "public", "index.html"));
});

const port = process.env.PORT || 4311;
app.listen(port, () => {
  console.log(`Qaulium Studio app running on http://localhost:${port}`);
});
