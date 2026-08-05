# Task Steps

## Round 3 — Program/Domain editing, Search + SL # everywhere, Date/Month/Year track

- [x] 1. Backend: Add `PUT /api/leads/:id/program-domain` endpoint (all roles) to edit only program & domain.
- [x] 2. Backend: `leadController.updateLeadProgramDomain` handler.
- [x] 3. Frontend: `LeadDetailModal.jsx` — add inline editable Program/Domain (all users).
- [x] 4. Frontend: `LeadsPage.jsx` — add month/year filter dropdowns (search bar already present, SL # already present).
- [x] 5. Frontend: `ManagerLmsPage.jsx` — add search bar (+ month/year if applicable).
- [x] 6. Frontend: `AnalyticsDashboard.jsx` — add month/year track for all roles.
- [x] 7. Build & verify.

## Round 4 — Fix bulk upload (0 inserted / 34 skipped)

- [x] 8. Fixed CSV parser to auto-detect tab vs comma delimiter (uploaded data was tab-separated, so every row parsed as one column and skipped as "Missing name or mobile").
- [x] 9. Normalize mobile numbers by removing spaces during upload for cleaner storage & duplicate detection.
