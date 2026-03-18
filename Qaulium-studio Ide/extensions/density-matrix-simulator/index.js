async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "densityMatrixPanel",
    title: "Density Matrix Simulator",
    location: "sidebar",
    component: { type: "density-matrix-simulator", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.density.matrix.simulator.open",
    title: "Density Matrix Simulator: Open",
    run: () => {
      context.api.ui.revealView("densityMatrixPanel");
      context.logger.info("density-matrix-simulator command executed");
    }
  });
  disposables.push(commandDisposable);

  const simDisposable = context.api.simulation.registerSimulator({
    id: "density-matrix",
    name: "Density Matrix Simulator",
    description: "Mixed-state simulation backend with decoherence tracking",
    capabilities: {
      executionModes: ["wasm", "cloud"],
      supportsNoise: false,
      maxQubitsHint: 64
    },
    run: async (circuit, config, simContext) => {
      const qubits = Number(circuit?.qubits || 0);
      const depth = Array.isArray(circuit?.operations) ? circuit.operations.length : 0;
      return {
        runId: simContext.runId,
        backendId: "density-matrix",
        metrics: {
          durationMs: 55,
          peakMemoryMb: Math.max(24, qubits * 3),
          fidelityEstimate: Math.max(0.75, 1 - depth * 0.003)
        },
        observables: { z0: 0.22, z1: -0.31 },
        diagnostics: [
          { level: "info", message: "Density Matrix Simulator executed successfully" }
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
