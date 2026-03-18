import type { ExtensionCompatibilityProfile, ExtensionHostApi } from "../../../integrations/shared/frontend-react-types";

export const profile: ExtensionCompatibilityProfile = {
    "extensionId":  "simulation-insights-visualizer",
    "extensionDisplayName":  "Simulation Insights Visualizer",
    "category":  "Visualization",
    "frontend":  {
                     "framework":  "react",
                     "entryPoint":  "integration/frontend-adapter.ts",
                     "panelId":  "simulationInsightsPanel",
                     "commands":  [
                                      "qaulium.visualization.insights.open"
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
                    "endpoint":  "http://localhost:9000/simulate/simulation-insights-visualizer",
                    "grpcService":  "qaulium.extensions.simulation.insights.visualizer.Runner",
                    "required":  false,
                    "simulationBackends":  [

                                           ]
                }
};

export function mountSimulationInsightsVisualizerAdapter(host: ExtensionHostApi): void {
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
