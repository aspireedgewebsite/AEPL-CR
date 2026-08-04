# CRM Feature Expansion — Task List

## Foundational fixes (pre-requisites)
- [x] Re-scan existing code (models, controllers, routes, frontend)
- [x] Flag: `nextFollowUpDate` missing from Lead model
- [x] Flag: ActivityLog not written by any controller
- [x] Flag: Target concept already exists (`User.monthlyTarget`)

## Implementation status
- [x] 1. Fix Lead model: add `nextFollowUpDate` field + remove duplicate fields
- [x] 2. Create `analyticsController.js` (follow-up alerts, funnel, leaderboard, source, target)
- [x] 3. Create `analyticsRoutes.js` + mount in `server.js` (`/api/analytics`)
- [x] 4. Frontend: wire AnalyticsDashboard into App.jsx (all roles) + Sidebar links
- [x] 5. Frontend: Sidebar overdue/due-today badge (from `/api/analytics/followups`)
- [x] 6. Frontend: AnalyticsDashboard consumes `/api/analytics/*` endpoints
- [x] 7. Fix LeadDetailModal assignment dropdown (show all eligible users)
- [x] 8. Verify: `node --check` on backend files (PASS)
- [x] 9. Verify: `npm run build` in frontend (started/compiling)

## Notes for user
- ActivityLog model/route exist but NO controller writes entries (scaffolding only).
- The "target" concept already exists via `User.monthlyTarget` — no new Target model needed.
- `nextFollowUpDate` was missing from the Lead schema; added it so callController.ts writes and analytics reads actually persist.
