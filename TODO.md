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

## Round 5 — Lead visibility for unassigned / super-admin-created leads

- [x] 10. Updated `leadVisibilityFilter` so managers, asst managers, and team leads can also see all **unassigned** leads (created by super admin or anyone), enabling them to claim/assign them down the chain. Once a lead is assigned, it no longer matches the "unassigned" filter and only appears in the assignee's chain. Employee visibility unchanged.

## Round 6 — Sample template download in Bulk Upload

- [x] 11. Added a "⬇ Download Sample Template (.csv)" button in `BulkUploadModal.jsx` that generates and downloads a sample CSV with the correct headers (name, mobile, email, program, domain) and an example row.

## Round 7 — Super Admin can create another Super Admin

- [x] 12. Backend `userController.js`: added `super_admin` to the super_admin's `CREATION_RULES` so a super admin can create another super admin. Also set `finalParentId = null` for created super admins (no hierarchy parent).
- [x] 13. Frontend `UserFormModal.jsx`: added `super_admin` to the super admin's creation options and added a "Super Admin" role label.

## Round 8 — User delete persistence + Edit option

- [x] 14. Backend `getUsers`: fixed so soft-deleted users are excluded for all roles (previously super_admin used `filter = {}` and deleted users reappeared on refresh).
- [x] 15. Backend `updateUser`: added password-reset support (super_admin only) so an edit modal can reset a user's login password.
- [x] 16. Frontend: created `UserEditModal.jsx` to edit name, phone, team name (asst_manager), monthly target, and optional password reset.
- [x] 17. Frontend `UsersPage.jsx`: added an "Edit" button (super_admin) next to Delete, and wired the edit modal.

## Round 9 — Deleted users can no longer log in

- [x] 18. Backend `authController.login`: login query now filters `isDeleted: false`, so a deleted user's credentials are rejected.
- [x] 19. Backend `middleware/auth.js` (protect): now rejects users where `isDeleted` is true, so a deleted user's existing token is invalidated.
- [x] 20. Backend `userController.deleteUser`: now also sets `isActive = false` on deletion (defensive), so even a cached token/user is immediately deactivated.
