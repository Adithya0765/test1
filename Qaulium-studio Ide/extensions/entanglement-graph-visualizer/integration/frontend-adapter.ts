import type { ExtensionCompatibilityProfile, ExtensionHostApi } from "../../../integrations/shared/frontend-react-types";

export const profile: ExtensionCompatibilityProfile = {
    "extensionId":  "entanglement-graph-visualizer",
    "extensionDisplayName":  "Entanglement Graph Visualizer",
    "category":  "Visualization",
    "frontend":  {
                     "framework":  "react",
                     "entryPoint":  "integration/frontend-adapter.ts",
                     "panelId":  "entanglementGraphPanel",
                     "commands":  [
                                      "qaulium.entanglement.graph.visualizer.open"
                                  ],
                     "eventsOut":  [
                                       "extension:ready",
                                       "view:mount",
                                       "simulation:result"
                                   ],
                     "eventsIn":  [
                                      "command:execute",
                                      "simulation:run",
                                      "state:update"
                                  ]
                 },
    "backend":  {
                    "language":  "c++",
                    "bridgeType":  "rest",
                    "endpoint":  "http://localhost:9000/simulate/entanglement-graph-visualizer",
                    "grpcService":  "qaulium.extensions.entanglement.graph.visualizer.Runner",
                    "required":  false,
                    "simulationBackends":  [

                                           ]
                }
};

export function mountEntanglementGraphVisualizerAdapter(host: ExtensionHostApi): void {
  if (profile.frontend.panelId) {
    host.mountView(profile.frontend.panelId, {
      extensionId: profile.extensionId,
      displayName: profile.extensionDisplayName,
      category: profile.category
    });
  }
}

export async function executePrimaryCommand(host: ExtensionHostApi): Promise<void> {
  const command = profile.frontend.commands[0];
  if (command) {
    await host.executeCommand(command, { source: "react-adapter" });
  }
}
