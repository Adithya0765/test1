export type Disposable = { dispose(): void };

export type ExecutionMode = "wasm" | "webgpu" | "cloud";

export interface CircuitModel {
  qubits: number;
  operations: Array<Record<string, unknown>>;
}

export interface SimulationConfig {
  shots?: number;
  noiseModel?: string;
  mode?: ExecutionMode;
}

export interface SimulationContext {
  signal?: AbortSignal;
  runId: string;
}

export interface SimulationResult {
  runId: string;
  backendId: string;
  metrics: {
    durationMs: number;
    peakMemoryMb?: number;
    fidelityEstimate?: number;
  };
  observables?: Record<string, number>;
  diagnostics?: Array<{ level: "info" | "warn" | "error"; message: string }>;
}

export interface SimulatorRegistration {
  id: string;
  name: string;
  description?: string;
  capabilities: {
    executionModes: ExecutionMode[];
    supportsNoise?: boolean;
    maxQubitsHint?: number;
  };
  run(
    circuit: CircuitModel,
    config: SimulationConfig,
    context: SimulationContext
  ): Promise<SimulationResult>;
}

export interface ViewRegistration {
  id: string;
  title: string;
  location: "sidebar" | "panel" | "editor";
  component: unknown;
}

export interface CommandRegistration {
  id: string;
  title: string;
  run(context: unknown): Promise<void> | void;
}

export interface QauliumApi {
  simulation: {
    registerSimulator(registration: SimulatorRegistration): Disposable;
  };
  ui: {
    registerView(registration: ViewRegistration): Disposable;
    revealView(id: string): void;
  };
  commands: {
    registerCommand(registration: CommandRegistration): Disposable;
  };
}

export interface ExtensionContext {
  extensionId: string;
  permissions: string[];
  subscriptions: Disposable[];
  api: QauliumApi;
  logger: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  };
}
