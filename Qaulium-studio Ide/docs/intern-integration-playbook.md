# Intern Integration Playbook

This playbook is for parallel frontend and backend integration work.

## Goal

Integrate all extension packages with minimal merge conflicts and clear contracts.

## Frontend intern checklist (React)

1. Call `GET /api/integrations/matrix` to list all extension compatibility profiles.
2. For each extension, call `GET /api/integrations/extension/:id`.
3. Import and use:
   - `extensions/<id>/integration/frontend-adapter.ts`
4. Use shared types from:
   - `integrations/shared/frontend-react-types.d.ts`
5. Mount extension views using `panelId` from compatibility profiles.
6. Wire command execution from adapter to extension command APIs.

## Backend intern checklist (C++)

1. Call `GET /api/integrations/handoff` to get the backend bridge map.
2. For each extension, implement bridge from:
   - `extensions/<id>/integration/backend-bridge.hpp`
   - `extensions/<id>/integration/backend-bridge.cpp`
3. Use shared backend contracts from:
   - `integrations/shared/backend-cpp-types.hpp`
4. Implement REST or gRPC endpoint based on compatibility profile.
5. Keep output schema compatible with extension simulation result contract.

## Team sync API endpoints

- Health: `/api/health`
- Compatibility matrix: `/api/integrations/matrix`
- Extension compatibility: `/api/integrations/extension/:id`
- Frontend/backend handoff bundle: `/api/integrations/handoff`

## Ready-to-integrate command

Run validation before handoff:

```bash
npm run integration:check
```

Expected output:
- `total` equals number of extensions in matrix
- `notReady` equals 0

## Integration order suggestion

1. Simulation extensions first
2. Visualization extensions next
3. AI/debugger/extensions after baseline flow is stable

## Notes

- All extensions already contain generated compatibility files.
- Intern teams should avoid editing extension runtime files (`index.js`) until adapters are wired.
