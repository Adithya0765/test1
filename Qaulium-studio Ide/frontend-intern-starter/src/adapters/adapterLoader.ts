import type { IntegrationApiClient } from "../api/integrationClient";

export interface LoadedAdapter {
  extensionId: string;
  panelId?: string;
  commandId?: string;
}

export async function loadAdapters(
  client: IntegrationApiClient,
  extensionIds: string[]
): Promise<LoadedAdapter[]> {
  const adapters: LoadedAdapter[] = [];

  for (const extensionId of extensionIds) {
    const profile = await client.getProfile(extensionId);
    adapters.push({
      extensionId,
      panelId: profile.frontend.panelId,
      commandId: profile.frontend.commands[0]
    });
  }

  return adapters;
}
