const fs = require("fs");
const path = require("path");

class IntegrationRegistry {
  constructor(options) {
    this.rootDir = options.rootDir;
    this.extensionsRoot = path.join(this.rootDir, "extensions");
    this.matrixPath = path.join(this.rootDir, "docs", "extension-compatibility-matrix.json");
  }

  readJson(filePath, fallback) {
    try {
      if (!fs.existsSync(filePath)) {
        return fallback;
      }
      const raw = fs.readFileSync(filePath, "utf8");
      const normalized = raw.replace(/^\uFEFF/, "").trim();
      if (!normalized) {
        return fallback;
      }
      return JSON.parse(normalized);
    } catch (_error) {
      return fallback;
    }
  }

  listMatrix() {
    return this.readJson(this.matrixPath, []);
  }

  getExtensionCompatibility(extensionId) {
    const compatibilityPath = path.join(
      this.extensionsRoot,
      extensionId,
      "integration",
      "compatibility.json"
    );
    const compatibility = this.readJson(compatibilityPath, null);
    if (!compatibility) {
      return null;
    }

    return {
      extensionId,
      compatibility,
      filePaths: {
        compatibility: path.relative(this.rootDir, compatibilityPath).replace(/\\/g, "/"),
        frontendAdapter: `extensions/${extensionId}/integration/frontend-adapter.ts`,
        backendBridgeHeader: `extensions/${extensionId}/integration/backend-bridge.hpp`,
        backendBridgeSource: `extensions/${extensionId}/integration/backend-bridge.cpp`
      }
    };
  }

  buildHandoffBundle() {
    const matrix = this.listMatrix();
    const frontend = matrix.map((entry) => ({
      extensionId: entry.extensionId,
      displayName: entry.displayName,
      category: entry.category,
      frontendAdapterPath: `extensions/${entry.extensionId}/integration/frontend-adapter.ts`,
      hasView: entry.views > 0,
      commandCount: entry.commands
    }));

    const backend = matrix.map((entry) => ({
      extensionId: entry.extensionId,
      displayName: entry.displayName,
      category: entry.category,
      backendHeaderPath: `extensions/${entry.extensionId}/integration/backend-bridge.hpp`,
      backendSourcePath: `extensions/${entry.extensionId}/integration/backend-bridge.cpp`,
      needsSimulationBridge: Boolean(entry.hasSimulationBackend)
    }));

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        extensions: matrix.length,
        simulationExtensions: matrix.filter((x) => x.hasSimulationBackend).length,
        frontendAdapters: frontend.length,
        backendBridges: backend.length
      },
      frontend,
      backend
    };
  }
}

module.exports = { IntegrationRegistry };
