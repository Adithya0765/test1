# Extension Compatibility Guide

This guide defines frontend and backend compatibility type integration for all current extensions.

## Shared type contracts

- Frontend React types: integrations/shared/frontend-react-types.d.ts
- Backend C++ bridge types: integrations/shared/backend-cpp-types.hpp

## Per-extension compatibility artifacts

Every extension now has:

- integration/compatibility.json
- integration/frontend-adapter.ts
- integration/backend-bridge.hpp
- integration/backend-bridge.cpp

## Coverage status

- Total extensions covered: 14
- Compatibility matrix: docs/extension-compatibility-matrix.json

## Integration model

Frontend compatibility type
- Framework: React
- Host API methods:
  - mountView(viewId, props)
  - executeCommand(commandId, payload)
  - runSimulation({ backendId, circuit, config })

Backend compatibility type
- Language: C++
- Transport: REST (default) with gRPC service identifiers in profile
- Interface: qaulium::ExtensionBackendBridge

## How to integrate each extension

1. Load extension integration/compatibility.json.
2. In React host, import integration/frontend-adapter.ts and mount panel.
3. In C++ backend service, implement integration/backend-bridge.hpp.
4. Keep request/response aligned with shared type contracts.

## Notes

- Simulation extensions are marked with hasSimulationBackend=true in matrix.
- Non-simulation extensions still receive frontend/backend compatibility stubs for future expansion.
