import { createIntegrationApiClient } from "./api/integrationClient";
import { loadAdapters } from "./adapters/adapterLoader";

async function bootstrap() {
  const client = createIntegrationApiClient();
  const matrix = await client.getMatrix();

  const extensionIds = matrix.map((m) => m.extensionId);
  const adapters = await loadAdapters(client, extensionIds);

  console.log("[frontend-starter] matrix count:", matrix.length);
  console.log("[frontend-starter] loaded adapters:", adapters.length);
  console.log(adapters);
}

bootstrap().catch((error) => {
  console.error("[frontend-starter] bootstrap failed", error);
});
