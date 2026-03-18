# Qaulium AI Admin Console

Enterprise-ready admin workspace for operations, lead management, messaging, forms, and platform governance.

## Included modules

- Overview dashboard with live KPIs
- User management (status controls and invite flow)
- Roles and permissions workspace
- API access control with key lifecycle management
- System monitoring and incident feed
- Billing analytics and plan performance
- Funnel analytics and operational insights
- Audit logs with export support
- Security policy center
- Notification queue manager
- Registrations, contacts, and careers data management
- Form builder, response manager, and CSV exports
- Professional email composer with template and HTML source editing

## Notes

- Enterprise modules now load from the backend dashboard bootstrap and server-backed admin enterprise state.
- Admin startup uses a consolidated `/api/admin/dashboard` payload to reduce first-load latency and repeated API calls.
- Monitoring cards use live runtime metrics from the server instead of synthetic/random placeholder values.
- Existing backend-powered modules continue using `/api/admin/*` endpoints and remain backward-compatible.
- The UI is optimized for desktop and mobile layouts.

## Local development (important for CORS)

- If you run this with VS Code Live Server (`127.0.0.1:5501`), requests to `https://qauliumai.in/api/*` can be blocked by CORS.
- Run with Vercel instead so `/api/*` is same-origin proxied:

```bash
vercel dev
```

- Then open the local Vercel URL and keep `API Base URL` as current origin (or leave it blank and use current origin behavior).

