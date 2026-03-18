import type { HandoffBundle, IntegrationMatrixItem, IntegrationProfile } from "../types/integration";

export interface IntegrationApiClient {
  getMatrix(): Promise<IntegrationMatrixItem[]>;
  getProfile(extensionId: string): Promise<IntegrationProfile>;
  getHandoffBundle(): Promise<HandoffBundle>;
}

export function createIntegrationApiClient(baseUrl = "http://localhost:4311"): IntegrationApiClient {
  async function request<T>(path: string): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`API request failed for ${path} with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  return {
    async getMatrix() {
      const data = await request<{ items: IntegrationMatrixItem[] }>("/api/integrations/matrix");
      return data.items;
    },
    async getProfile(extensionId: string) {
      const data = await request<{ ok: boolean; compatibility: IntegrationProfile }>(`/api/integrations/extension/${extensionId}`);
      return data.compatibility;
    },
    async getHandoffBundle() {
      const data = await request<{ ok: boolean; bundle: HandoffBundle }>("/api/integrations/handoff");
      return data.bundle;
    }
  };
}
