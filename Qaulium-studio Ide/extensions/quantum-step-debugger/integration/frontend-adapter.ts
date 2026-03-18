import type { ExtensionCompatibilityProfile, ExtensionHostApi } from "../../../integrations/shared/frontend-react-types";

export const profile: ExtensionCompatibilityProfile = {
    "extensionId":  "quantum-step-debugger",
    "extensionDisplayName":  "Quantum Step Debugger",
    "category":  "Debugger",
    "frontend":  {
                     "framework":  "react",
                     "entryPoint":  "integration/frontend-adapter.ts",
                     "panelId":  "quantumStepDebuggerPanel",
                     "commands":  [
                                      "qaulium.quantum.step.debugger.open"
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
                    "endpoint":  "http://localhost:9000/simulate/quantum-step-debugger",
                    "grpcService":  "qaulium.extensions.quantum.step.debugger.Runner",
                    "required":  false,
                    "simulationBackends":  [

                                           ]
                }
};

export function mountQuantumStepDebuggerAdapter(host: ExtensionHostApi): void {
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
