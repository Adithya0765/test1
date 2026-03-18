import type { ExtensionCompatibilityProfile, ExtensionHostApi } from "../../../integrations/shared/frontend-react-types";

export const profile: ExtensionCompatibilityProfile = {
    "extensionId":  "noise-aware-simulator",
    "extensionDisplayName":  "Noise-Aware Simulator",
    "category":  "Simulation",
    "frontend":  {
                     "framework":  "react",
                     "entryPoint":  "integration/frontend-adapter.ts",
                     "panelId":  "noiseAwarePanel",
                     "commands":  [
                                      "qaulium.noise.aware.simulator.open"
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
                    "endpoint":  "http://localhost:9000/simulate/noise-aware-simulator",
                    "grpcService":  "qaulium.extensions.noise.aware.simulator.Runner",
                    "required":  true,
                    "simulationBackends":  [
                                               "noise-aware"
                                           ]
                }
};

export function mountNoiseAwareSimulatorAdapter(host: ExtensionHostApi): void {
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
