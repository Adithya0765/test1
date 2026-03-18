const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadExtensionModule(extensionDir, mainFileRelative) {
  const mainFile = path.join(extensionDir, mainFileRelative);
  const code = fs.readFileSync(mainFile, "utf8");

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require,
    console,
    setTimeout,
    clearTimeout,
    fetch: typeof fetch === "function" ? fetch : undefined,
    AbortController: typeof AbortController === "function" ? AbortController : undefined,
    URL,
    URLSearchParams
  };

  vm.createContext(sandbox);
  const script = new vm.Script(code, {
    filename: mainFile,
    displayErrors: true
  });
  script.runInContext(sandbox, { timeout: 2000 });
  return sandbox.module.exports;
}

module.exports = { loadExtensionModule };
