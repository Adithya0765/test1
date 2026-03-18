# Frontend Intern Starter

Ready-to-integrate starter for React frontend interns.

## What this includes

- Typed API client for integration endpoints
- Adapter loader that resolves extension compatibility profiles
- Bootstrap example to load all extension adapters

## Integration endpoints consumed

- `/api/integrations/matrix`
- `/api/integrations/extension/:id`
- `/api/integrations/handoff`

## Quick start

1. Install dev dependency:
   - `npm install`
2. Type-check/build:
   - `npm run typecheck`
   - `npm run build`
3. Ensure Qaulium server is running on `http://localhost:4311`

## Next step for frontend team

- Replace console output in `src/main.ts` with actual React context/provider wiring.
- Use `panelId` and `commands` from profiles to mount views and command buttons.
