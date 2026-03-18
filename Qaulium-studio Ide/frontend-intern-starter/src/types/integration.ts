export interface IntegrationMatrixItem {
  extensionId: string;
  displayName: string;
  category: string;
  hasSimulationBackend: boolean;
  commands: number;
  views: number;
}

export interface IntegrationProfile {
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
    bridgeType: "rest" | "grpc" | "ipc";
    endpoint?: string;
    grpcService?: string;
    required?: boolean;
    simulationBackends: string[];
  };
}

export interface HandoffBundle {
  generatedAt: string;
  totals: {
    extensions: number;
    simulationExtensions: number;
    frontendAdapters: number;
    backendBridges: number;
  };
  frontend: Array<{
    extensionId: string;
    displayName: string;
    category: string;
    frontendAdapterPath: string;
    hasView: boolean;
    commandCount: number;
  }>;
  backend: Array<{
    extensionId: string;
    displayName: string;
    category: string;
    backendHeaderPath: string;
    backendSourcePath: string;
    needsSimulationBridge: boolean;
  }>;
}
