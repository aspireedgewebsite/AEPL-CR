# Task Steps

## Lead Finalization, Auto Payment-to-Operation, Superadmin Month Filter

- [x] 1. Backend: `paymentController.addPayment` — accept `agreedAmount` to set `lead.totalAgreedAmount`, and auto-set `sentToOperation: true` / `sentToOperationAt` so every payment goes directly to Operation invoice list.
- [x] 2. Frontend: `LeadDetailModal.jsx` — add "Final Amount (Agreed)" input in payments form; send `agreedAmount`; show Agreed/Paid/Pending in Details tab.
- [x] 3. Frontend: `LeadsTable.jsx` — add "Agreed" and "Pending" columns.
- [x] 4. Frontend: `SuperAdminOverview.jsx` — add month-wise dropdown and pass `year` + `month` to `/dashboard/summary`.

## Round 2 — Super Admin Bulk Assign, Serial #, Date-wise Track, Payment Amounts

- [x] 5. Backend: `leadController.applyLeadAssignment` — allow super_admin to assign `managerId` (assign to every level).
- [x] 6. Backend: `paymentController.getAllPayments` — populate `totalAgreedAmount`/`totalPaidAmount` for lead.
- [x] 7. Frontend: `BulkAssignModal.jsx` — add super_admin role selector + user picker (bulk assign to everyone).
- [x] 8. Frontend: `LeadsTable.jsx` — add serial number (#) column.
- [x] 9. Frontend: `SuperAdminOverview.jsx` — add date-wise (daily) track when a month is selected.
- [x] 10. Frontend: `OperationPaymentsPage.jsx` — show Finalized / Received / Pending columns.
- [x] 11. Frontend: `SuperAdminPayments.jsx` — show Finalized / Received / Pending columns.
- [x] 12. Build & verify.
