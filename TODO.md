# Task Steps

## Lead Finalization, Auto Payment-to-Operation, Superadmin Month Filter

- [x] 1. Backend: `paymentController.addPayment` — accept `agreedAmount` to set `lead.totalAgreedAmount`, and auto-set `sentToOperation: true` / `sentToOperationAt` so every payment goes directly to Operation invoice list.
- [x] 2. Frontend: `LeadDetailModal.jsx` — add "Final Amount (Agreed)" input in payments form; send `agreedAmount`; show Agreed/Paid/Pending in Details tab.
- [x] 3. Frontend: `LeadsTable.jsx` — add "Agreed" and "Pending" columns.
- [x] 4. Frontend: `SuperAdminOverview.jsx` — add month-wise dropdown and pass `year` + `month` to `/dashboard/summary`.
- [x] 5. Test backend & frontend flows.
