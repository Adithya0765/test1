export type IntegrationTransport = "rest" | "grpc" | "ipc";

export interface QuantumCircuitPayload {
  qubits: number;
  operations: Array<Record<string, unknown>>;
}

export interface SimulationConfigPayload {
  mode?: "wasm" | "webgpu" | "cloud";
  shots?: number;
  noiseModel?: string;
  useRemoteBackend?: boolean;
}

export interface SimulationMetrics {
  durationMs: number;
  peakMemoryMb?: number;
  fidelityEstimate?: number;
}

export interface SimulationResultPayload {
  runId: string;
  backendId: string;
  metrics: SimulationMetrics;
  observables?: Record<string, number>;
  diagnostics?: Array<{ level: "info" | "warn" | "error"; message: string }>;
  integration?: Record<string, unknown>;
}

export interface ExtensionCompatibilityProfile {
  extensionId: string;
  extensionDisplayName: string;
  category: string;
  frontend: {
    framework: "react";
    entryPoint: string;
    panelId?: string;
    commands: string[];
    eventsOut: string[];
    eventsIn: string[];
  };
  backend: {
    language: "c++";
    bridgeType: IntegrationTransport;
    endpoint?: string;
    grpcService?: string;
    required?: boolean;
    simulationBackends: string[];
  };
}

export interface ExtensionHostApi {
  runSimulation(request: {
    backendId: string;
    circuit: QuantumCircuitPayload;
    config: SimulationConfigPayload;
  }): Promise<{ ok: boolean; result: SimulationResultPayload }>;
  executeCommand(commandId: string, payload?: Record<string, unknown>): Promise<void>;
  mountView(viewId: string, props?: Record<string, unknown>): void;
}
