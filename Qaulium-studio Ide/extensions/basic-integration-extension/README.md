# Basic Integration Extension

A complete but minimal extension package designed for future integration:

- Frontend target: React
- Backend target: C++ service (REST or gRPC)

## Included

- `extension.json`: full manifest with command/view/simulator contributions.
- `index.js`: lifecycle hooks and basic simulator implementation.
- `contracts/frontend-react-contract.json`: expected React host adapter interface.
- `contracts/backend-cpp-contract.json`: expected C++ service bridge interface.
- `integrations/react`: React hook and panel module.
- `integrations/cpp-service`: C++ REST stub service.

## Lifecycle Hooks

- `activate(context)`
- `deactivate()`
- `dispose()`

## Commands

- `qaulium.basic.ping`
- `qaulium.basic.healthCheck`

## Simulator Backend

- ID: `basic-statevector`
- Modes: `wasm`, `cloud`

## Remote C++ Backend Mode

- Cloud mode can call a remote C++ backend endpoint.
- Default endpoint: `http://localhost:9000/simulate/basic`
- Override endpoint with environment variable `BASIC_CPP_BACKEND_URL`.
- If remote call fails, extension automatically falls back to local execution.

## Integration Plan (Future)

1. React host should call `setFrontendAdapter(...)` during extension bootstrap.
2. C++ bridge should call `setBackendAdapter(...)` and route run requests to your service.
3. Use `integrations/react/useBasicIntegrationBridge.ts` in your React UI to run simulations.
4. Build and run `integrations/cpp-service` to provide `/simulate/basic` endpoint.
5. Keep returned result schema unchanged so existing visualization components continue to work.
