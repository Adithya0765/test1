# Backend Intern Starter

Ready-to-integrate C++ scaffold for extension backend routing.

## Includes

- Bridge router abstraction for extension-specific simulation bridges
- REST router stub (`/route/simulate`)
- gRPC proto service definition
- REST mapping contract JSON

## Files

- `cpp/include/bridge_router.hpp`
- `cpp/src/bridge_router.cpp`
- `cpp/src/rest_router_stub.cpp`
- `cpp/CMakeLists.txt`
- `proto/extension_router.proto`
- `rest-mapping/router-mapping.json`

## Build

```bash
cmake -S cpp -B build
cmake --build build --config Release
```

## Run

```bash
./build/backend_intern_starter
```

Runs on `http://localhost:9001`.

## Backend team next tasks

1. Register all generated extension bridges from `extensions/*/integration/backend-bridge.hpp`.
2. Parse full circuit/config JSON into request model.
3. Implement gRPC router using `proto/extension_router.proto`.
4. Add authentication and request tracing before production use.
