const fs = require("fs");
const path = require("path");

class ExtensionRegistry {
  constructor(options) {
    this.extensionsRoot = options.extensionsRoot;
    this.marketplacePath = options.marketplacePath;
    this.installedPath = options.installedPath;
    this.installed = this.readJson(this.installedPath, []);
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
    } catch (error) {
      return fallback;
    }
  }

  writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
  }

  getMarketplace() {
    return this.readJson(this.marketplacePath, []);
  }

  listInstalled() {
    return this.installed;
  }

  isInstalled(id) {
    return this.installed.some((entry) => entry.id === id);
  }

  installById(id) {
    if (this.isInstalled(id)) {
      return { ok: false, message: "Extension already installed" };
    }

    const marketplace = this.getMarketplace();
    const entry = marketplace.find((item) => item.id === id);
    if (!entry) {
      return { ok: false, message: "Extension not found in marketplace" };
    }

    const extensionDir = path.join(this.extensionsRoot, id);
    const manifestPath = path.join(extensionDir, "extension.json");
    if (!fs.existsSync(manifestPath)) {
      return { ok: false, message: "Extension package is missing extension.json" };
    }

    const manifest = this.readJson(manifestPath, null);
    if (!manifest || !manifest.name || !manifest.main) {
      return { ok: false, message: "Invalid extension manifest" };
    }

    const record = {
      id,
      name: manifest.displayName || manifest.name,
      version: manifest.version || "0.0.0",
      publisher: manifest.publisher || "unknown",
      status: "installed"
    };

    this.installed.push(record);
    this.writeJson(this.installedPath, this.installed);
    return { ok: true, record };
  }

  uninstallById(id) {
    const before = this.installed.length;
    this.installed = this.installed.filter((entry) => entry.id !== id);
    if (this.installed.length === before) {
      return { ok: false, message: "Extension was not installed" };
    }

    this.writeJson(this.installedPath, this.installed);
    return { ok: true };
  }
}

module.exports = { ExtensionRegistry };
