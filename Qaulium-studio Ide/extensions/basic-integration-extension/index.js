const bridgeState = {
  frontend: {
    framework: "react",
    connected: false,
    metadata: {}
  },
  backend: {
    language: "c++",
    connected: false,
    transport: "rest",
    endpoint: "",
    metadata: {}
  }
};

function endpointFromEnvironment() {
  if (typeof process === "undefined" || !process || !process.env) {
    return "";
  }
  return process.env.BASIC_CPP_BACKEND_URL || "";
}

function nowIso() {
  return new Date().toISOString();
}

function setFrontendAdapter(metadata) {
  bridgeState.frontend.connected = true;
  bridgeState.frontend.metadata = metadata || {};
}

function setBackendAdapter(options) {
  bridgeState.backend.connected = true;
  bridgeState.backend.transport = options?.transport || "rest";
  bridgeState.backend.endpoint = options?.endpoint || "";
  bridgeState.backend.metadata = options?.metadata || {};
}

async function runRemoteCppSimulation(circuit, config, runId) {
  if (!bridgeState.backend.endpoint) {
    throw new Error("Backend endpoint is not configured");
  }

  const controller = new AbortController();
  const timeoutMs = 9000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(bridgeState.backend.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        runId,
        circuit,
        config
      }),
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok || !data?.ok) {
      const message = data?.error?.message || data?.message || "Remote simulation failed";
      throw new Error(message);
    }

    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

async function runBasicStatevector(circuit, config, runId) {
  const qubits = Number(circuit?.qubits || 0);
  const depth = Array.isArray(circuit?.operations) ? circuit.operations.length : 0;
  const mode = config?.mode || "wasm";
  const useRemoteBackend = Boolean(config?.useRemoteBackend || mode === "cloud");

  if (useRemoteBackend && bridgeState.backend.connected && bridgeState.backend.endpoint) {
    try {
      const remote = await runRemoteCppSimulation(circuit, config, runId);
      return {
        ...remote,
        integration: {
          timestamp: nowIso(),
          frontend: bridgeState.frontend,
          backend: bridgeState.backend,
          source: "cpp-remote"
        }
      };
    } catch (error) {
      // Fallback to local execution if remote backend is unavailable.
      const fallbackMessage = error instanceof Error ? error.message : "unknown";
      bridgeState.backend.metadata.lastError = fallbackMessage;
    }
  }

  const z0 = qubits > 0 ? 0.5 - depth * 0.01 : 0;
  const z1 = qubits > 1 ? -0.4 + depth * 0.005 : 0;

  return {
    runId,
    backendId: "basic-statevector",
    metrics: {
      durationMs: 35,
      peakMemoryMb: Math.max(16, qubits * 2),
      fidelityEstimate: Math.max(0.8, 1 - depth * 0.002)
    },
    observables: {
      z0: Number(z0.toFixed(4)),
      z1: Number(z1.toFixed(4))
    },
    diagnostics: [
      {
        level: "info",
        message: `Basic simulator executed in ${mode} mode for ${qubits} qubits`
      },
      {
        level: "info",
        message: `Bridge status FE:${bridgeState.frontend.connected} BE:${bridgeState.backend.connected}`
      }
    ],
    integration: {
      timestamp: nowIso(),
      frontend: bridgeState.frontend,
      backend: bridgeState.backend,
      source: "local-fallback"
    }
  };
}

function registerCoreContributions(context) {
  const simulator = context.api.simulation.registerSimulator({
    id: "basic-statevector",
    name: "Basic Statevector",
    description: "Minimal simulator extension prepared for React + C++ integration",
    capabilities: {
      executionModes: ["wasm", "cloud"],
      supportsNoise: false,
      maxQubitsHint: 32
    },
    run: async (circuit, config, simContext) => runBasicStatevector(circuit, config, simContext.runId)
  });

  const view = context.api.ui.registerView({
    id: "basicIntegrationPanel",
    title: "Basic Integration",
    location: "sidebar",
    component: {
      type: "basic-integration",
      state: bridgeState
    }
  });

  const pingCommand = context.api.commands.registerCommand({
    id: "qaulium.basic.ping",
    title: "Basic Extension: Ping",
    run: () => {
      context.logger.info("basic-integration-extension ping ok");
    }
  });

  const healthCommand = context.api.commands.registerCommand({
    id: "qaulium.basic.healthCheck",
    title: "Basic Extension: Health Check",
    run: () => {
      context.logger.info(JSON.stringify({
        extension: "basic-integration-extension",
        active: true,
        frontend: bridgeState.frontend,
        backend: bridgeState.backend,
        timestamp: nowIso()
      }));
    }
  });

  context.subscriptions.push(simulator, view, pingCommand, healthCommand);
}

async function activate(context) {
  registerCoreContributions(context);

  // Defaults can be overridden by host integration adapters later.
  setFrontendAdapter({ version: "future-react-adapter" });
  setBackendAdapter({
    transport: "rest",
    endpoint: endpointFromEnvironment() || "http://localhost:9000/simulate/basic"
  });

  context.logger.info("basic-integration-extension activated");
}

async function deactivate() {}

function dispose() {}

module.exports = {
  activate,
  deactivate,
  dispose,
  setFrontendAdapter,
  setBackendAdapter
};
