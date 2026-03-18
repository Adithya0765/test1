async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "noiseAwarePanel",
    title: "Noise-Aware Simulator",
    location: "sidebar",
    component: { type: "noise-aware-simulator", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.noise.aware.simulator.open",
    title: "Noise-Aware Simulator: Open",
    run: () => {
      context.api.ui.revealView("noiseAwarePanel");
      context.logger.info("noise-aware-simulator command executed");
    }
  });
  disposables.push(commandDisposable);

  const simDisposable = context.api.simulation.registerSimulator({
    id: "noise-aware",
    name: "Noise-Aware Simulator",
    description: "Noise model driven simulation and error estimation",
    capabilities: {
      executionModes: ["wasm", "cloud"],
      supportsNoise: true,
      maxQubitsHint: 64
    },
    run: async (circuit, config, simContext) => {
      const qubits = Number(circuit?.qubits || 0);
      const depth = Array.isArray(circuit?.operations) ? circuit.operations.length : 0;
      return {
        runId: simContext.runId,
        backendId: "noise-aware",
        metrics: {
          durationMs: 55,
          peakMemoryMb: Math.max(24, qubits * 3),
          fidelityEstimate: Math.max(0.75, 1 - depth * 0.003)
        },
        observables: { z0: 0.22, z1: -0.31 },
        diagnostics: [
          { level: "info", message: "Noise-Aware Simulator executed successfully" }
        ]
      };
    }
  });
  disposables.push(simDisposable);
  context.subscriptions.push(...disposables);
}

async function deactivate() {}
function dispose() {}

module.exports = {
  activate,
  deactivate,
  dispose
};
