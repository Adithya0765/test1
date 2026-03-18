# Qaulium Studio Extension Platform Architecture

This package defines a VS Code style extension ecosystem for Qaulium Studio, optimized for quantum simulation and research workflows.

It now also includes a runnable full-stack reference app that implements the architecture:

- Extension registry and lifecycle manager
- Extension sandbox loading
- Marketplace install/uninstall flows
- Simulator registration and execution API
- Browser IDE shell for extension and simulation control

## Deliverables (Current)

- Extension compatibility guide: `docs/extension-compatibility-guide.md`
- Compatibility matrix for all extensions: `docs/extension-compatibility-matrix.json`
- Intern integration handoff playbook: `docs/intern-integration-playbook.md`
- Launch pack inventory: `docs/launch-pack-12-extensions.md`
- Shared integration contracts: `integrations/shared/`
- Per-extension integration files: `extensions/*/integration/`
- Frontend intern starter: `frontend-intern-starter/`
- Backend intern starter: `backend-intern-starter/`

## Core Design Principles

1. Keep the IDE core minimal, stable, and secure.
2. Move advanced and low-frequency features to installable extensions.
3. Use explicit capability permissions and sandboxed runtimes.
4. Keep extension APIs asynchronous and worker-first.
5. Separate UI contributions from compute-heavy simulation execution.

## Recommended Technology Stack

Frontend
- React
- Monaco Editor
- WebGPU
- Three.js
- Web Workers

Backend
- FastAPI or Node.js (gateway and orchestration)
- Rust simulation engines (WASM/native)
- Redis queue
- PostgreSQL

## Quick Start for Intern Teams

1. Start platform server with `npm start`.
2. Frontend interns use `frontend-intern-starter/` and integration APIs.
3. Backend interns use `backend-intern-starter/` bridge router scaffold.
4. Regenerate compatibility files if extension manifests change.
5. Run readiness gate before merge.

## Run the Complete App

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open:

```text
http://localhost:4311
```

## Runtime App Structure

- `server/index.js`: REST API + static app hosting
- `server/core/extensionRegistry.js`: install/uninstall and manifest validation
- `server/core/lifecycleManager.js`: activate/deactivate/dispose and registration APIs
- `server/core/sandboxRuntime.js`: isolated module execution via VM context
- `server/core/integrationRegistry.js`: integration matrix/profile/handoff bundle APIs
- `server/data/marketplace.json`: marketplace catalog
- `server/data/installed.json`: installed extension state
- `public/index.html`, `public/styles.css`, `public/main.js`: IDE web shell UI
- `extensions/*`: installable extension packages

## Organized Structure for Integration

- `frontend-intern-starter/`: React-side API client and adapter loader starter
- `backend-intern-starter/`: C++ bridge router scaffold with REST/gRPC mapping
- `integrations/shared/`: shared frontend/backend compatibility types
- `extensions/*/integration/`: per-extension compatibility and bridge files
- `docs/intern-integration-playbook.md`: handoff process for intern teams

## Intern Integration Commands

- Generate/update compatibility files:

```bash
powershell -ExecutionPolicy Bypass -File scripts/generate-extension-compatibility.ps1
```

- Validate readiness before merge:

```bash
npm run integration:check
```
