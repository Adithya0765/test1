const fs = require("fs");
const path = require("path");
const { loadExtensionModule } = require("./sandboxRuntime");

class LifecycleManager {
  constructor(options) {
    this.extensionsRoot = options.extensionsRoot;
    this.active = new Map();
    this.simulators = new Map();
    this.views = new Map();
    this.commands = new Map();
  }

  buildContext(extensionId) {
    const subscriptions = [];

    const api = {
      simulation: {
        registerSimulator: (registration) => {
          this.simulators.set(registration.id, {
            extensionId,
            registration
          });
          return {
            dispose: () => this.simulators.delete(registration.id)
          };
        }
      },
      ui: {
        registerView: (view) => {
          this.views.set(view.id, { extensionId, ...view });
          return {
            dispose: () => this.views.delete(view.id)
          };
        },
        revealView: () => {}
      },
      commands: {
        registerCommand: (command) => {
          this.commands.set(command.id, { extensionId, ...command });
          return {
            dispose: () => this.commands.delete(command.id)
          };
        }
      }
    };

    return {
      extensionId,
      permissions: [],
      subscriptions,
      api,
      logger: {
        info: (message) => console.log(`[${extensionId}] ${message}`),
        warn: (message) => console.warn(`[${extensionId}] ${message}`),
        error: (message) => console.error(`[${extensionId}] ${message}`)
      }
    };
  }

  loadManifest(extensionId) {
    const manifestPath = path.join(this.extensionsRoot, extensionId, "extension.json");
    const raw = fs.readFileSync(manifestPath, "utf8");
    const normalized = raw.replace(/^\uFEFF/, "").trim();
    return JSON.parse(normalized);
  }

  async activate(extensionId) {
    if (this.active.has(extensionId)) {
      return { ok: true, message: "Already active" };
    }

    const manifest = this.loadManifest(extensionId);
    const moduleExports = loadExtensionModule(
      path.join(this.extensionsRoot, extensionId),
      manifest.main
    );

    if (typeof moduleExports.activate !== "function") {
      return { ok: false, message: "Extension has no activate function" };
    }

    const context = this.buildContext(extensionId);
    await Promise.resolve(moduleExports.activate(context));

    this.active.set(extensionId, {
      manifest,
      moduleExports,
      context
    });

    return { ok: true, message: "Activated" };
  }

  async deactivate(extensionId) {
    if (!this.active.has(extensionId)) {
      return { ok: false, message: "Extension is not active" };
    }

    const entry = this.active.get(extensionId);

    if (typeof entry.moduleExports.deactivate === "function") {
      await Promise.resolve(entry.moduleExports.deactivate());
    }

    if (Array.isArray(entry.context.subscriptions)) {
      entry.context.subscriptions.forEach((item) => {
        if (item && typeof item.dispose === "function") {
          item.dispose();
        }
      });
    }

    if (typeof entry.moduleExports.dispose === "function") {
      entry.moduleExports.dispose();
    }

    this.active.delete(extensionId);
    return { ok: true, message: "Deactivated" };
  }

  listActive() {
    return Array.from(this.active.keys());
  }

  listSimulators() {
    return Array.from(this.simulators.values()).map((item) => ({
      extensionId: item.extensionId,
      id: item.registration.id,
      name: item.registration.name,
      capabilities: item.registration.capabilities
    }));
  }

  listViews() {
    return Array.from(this.views.values()).map((view) => ({
      extensionId: view.extensionId,
      id: view.id,
      title: view.title,
      location: view.location
    }));
  }

  async runSimulation(backendId, circuit, config) {
    const simulator = this.simulators.get(backendId);
    if (!simulator) {
      return {
        ok: false,
        message: "Simulator backend is not registered"
      };
    }

    const result = await simulator.registration.run(circuit, config || {}, {
      runId: `run_${Date.now()}`,
      signal: null
    });

    return {
      ok: true,
      backendId,
      result
    };
  }
}

module.exports = { LifecycleManager };
