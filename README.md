# Odissitech CRM

A role-based CRM for Odissitech (MERN stack: MongoDB, Express, React, Node).

## Roles implemented

| Role | Login role value | Can do |
|---|---|---|
| Super Admin | `super_admin` | Sees everything, month/year graphs, edit/delete any payment |
| Manager | `manager` (Admin-1) | Create users, add/bulk-upload leads, assign leads to Asst. Managers, send each payment to Operation, hand off fully paid leads to LMS |
| Asst. Manager | `asst_manager` (Admin-2) | Add own leads + bulk upload, assign Team Leads to their team, assign leads to Team Leads |
| Team Lead | `team_lead` | Assign leads to Employees, call leads, log updates |
| Employee | `employee` | Call leads, log updates, submit payments (up to 10 installments per lead) |
| Operation | `operation` | Payments/Invoice tab (enter invoice number, locks the row) + LMS tab (Offer Letter / LMS Access / Certificate) |

## Project structure

```
odissitech-crm/
  backend/     Express + MongoDB (Mongoose) API, JWT auth, role middleware
  frontend/    React (Vite) + Tailwind + Recharts dashboard
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env if needed - by default it points to local MongoDB:
# MONGO_URI=mongodb://127.0.0.1:27017/odissitech_crm

# Make sure MongoDB is running locally, e.g.:
# mongod --dbpath /some/local/path

npm run seed   # creates the first Super Admin (see console output for credentials)
npm run dev    # starts the API on http://localhost:5000
```

Default seeded Super Admin:
- email: `superadmin@odissitech.com`
- password: `ChangeMe@123` (change this after first login — there's no self-service
  password-change screen yet, so update it directly in MongoDB or add one before going live)

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev    # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` calls to `http://localhost:5000`, so both must be running.

## 3. First-time flow

1. Log in as Super Admin.
2. (Optional, via a direct API call or a quick script) create your Managers — the UI's
   "Add Team Member" is restricted to roles a logged-in user is allowed to create
   (Super Admin can create Managers; Managers create Asst. Managers/Team Leads/Employees/
   Operation; Asst. Managers create Team Leads/Employees).
3. Log in as a Manager → **Team & Users** → add Asst. Managers.
4. Log in as each Asst. Manager → **My Team** → add Team Leads and Employees.
5. Asst. Manager uses a lead's **Assign** tab to place a Team Lead under their team,
   and Team Lead does the same to place Employees under themselves (via the lead
   Assign tab's team-member dropdown, or extend `PUT /api/users/:id` with a `parentId`
   for direct org-chart assignment without going through a lead).
6. Managers add/bulk-upload leads (CSV or Excel with columns `name, mobile, email,
   program, domain`) and assign them to an Asst. Manager, who assigns to a Team Lead,
   who assigns to an Employee.
7. Whoever calls a lead logs the call and what the lead said, from the lead's **Calls** tab.
8. On conversion, the calling user adds a payment (amount, program, domain, UTR) from
   the **Payments** tab — up to 10 installments per lead. Only Super Admin can edit or
   delete a submitted payment.
9. Manager sends each individual payment to Operation as it comes in
   (**Payments** tab → "Send to Operation").
10. Operation enters the invoice number for that payment in **Payments & Invoices**;
    once submitted, that row locks.
11. Once a lead is fully paid, Manager sends it to Operation's **LMS** tab
    (lead's **Details** tab → "Send Fully Paid Lead to Operation (LMS)", or the
    **Send to Operation (LMS)** page listing all such leads).
12. Operation processes the LMS record with three actions: Send Offer Letter,
    Grant LMS Access, Send Certificate.
13. Super Admin's **Overview & Graphs** page shows month-wise and year-wise leads,
    conversions, and revenue across the whole company.

## Notes / next steps for production

- Change `JWT_SECRET` in `.env` to a long random value before deploying.
- Multer 1.x (used for file upload) has known vulnerabilities; consider upgrading to
  Multer 2.x before production use.
- Add a "change password" screen (backend already hashes passwords with bcrypt;
  only a route is missing).
- Add pagination to the leads/payments tables once data volume grows.
- Consider moving uploaded CSV/Excel files to cloud storage instead of local disk
  if you deploy on an ephemeral filesystem (e.g. most PaaS platforms).
