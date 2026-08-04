# CRM Feature Expansion — Task List

## Foundational fixes (pre-requisites)
- [x] Re-scan existing code (models, controllers, routes, frontend)
- [x] Flag: `nextFollowUpDate` missing from Lead model
- [x] Flag: ActivityLog not written by any controller
- [x] Flag: Target concept already exists (`User.monthlyTarget`)

## Implementation order
- [ ] 1. Fix Lead model: add `nextFollowUpDate` field + index
- [ ] 2. Create `analyticsController.js` (overdue/due-today, funnel, leaderboard, source, target)
- [ ] 3. Create `analyticsRoutes.js` + mount in `server.js`
- [ ] 4. Remove relocated analytics from `dashboardController.js` + `dashboardRoutes.js`
- [ ] 5. Frontend: wire AnalyticsDashboard into App.jsx + Sidebar link
- [ ] 6. Frontend: Sidebar overdue/due-today badge
- [ ] 7. Verify per item: `node --check` + `npm run build`
