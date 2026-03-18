# Cloud Credit Frontend Demo (Mock)

This is a basic visualization frontend for client review before building the complete prototype.

## Files

- `index.html` - demo UI shell
- `styles.css` - responsive visual design
- `mock-data.js` - mock organization, credit, usage, and ledger data
- `app.js` - UI rendering and workflow simulator logic

## How to run

1. Open `Cloud Credit System/frontend-demo/index.html` in a browser.
2. Use the Cost Estimate Simulator to test pricing behavior.
3. Click **Simulate Job Lifecycle** to preview reserve -> settle -> refund flow.

## What this demonstrates

- Credit bucket visibility and expiry priority
- Usage trend and service cost composition
- Estimate formula from architecture docs
- Transaction table with idempotency references
- Client-facing workflow preview with no backend dependency

## After client approval

- Replace `mock-data.js` values with API responses from `/api/v1/credits/*`.
- Add auth and organization/project switching.
- Connect simulator actions to reserve and settle endpoints.
