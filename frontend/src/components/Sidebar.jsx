import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";

const NAV_BY_ROLE = {
  super_admin: [
    { to: "/super-admin", label: "Overview & Graphs" },
    { to: "/super-admin/leads", label: "All Leads" },
    { to: "/super-admin/users", label: "All Users" },
    { to: "/super-admin/payments", label: "All Payments" },
  ],
  manager: [
    { to: "/manager", label: "Overview" },
    { to: "/manager/leads", label: "Leads" },
    { to: "/manager/users", label: "Team & Users" },
    { to: "/manager/lms", label: "Send to Operation (LMS)" },
  ],
  asst_manager: [
    { to: "/asst-manager", label: "Overview" },
    { to: "/asst-manager/leads", label: "Leads" },
    { to: "/asst-manager/users", label: "My Team" },
    { to: "/asst-manager/lms", label: "Send to Operation (LMS)" },
  ],
  team_lead: [
    { to: "/team-lead", label: "Overview" },
    { to: "/team-lead/leads", label: "Leads" },
  ],
  employee: [
    { to: "/employee", label: "Overview" },
    { to: "/employee/leads", label: "My Leads" },
  ],
  operation: [
    { to: "/operation", label: "Overview" },
    { to: "/operation/payments", label: "Payments & Invoices" },
    { to: "/operation/lms", label: "LMS" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const links = NAV_BY_ROLE[user.role] || [];

  return (
    <aside className="w-64 shrink-0 bg-ink text-white min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="font-display text-xl font-semibold tracking-tight">Odissitech</div>
        <div className="text-xs text-white/50 mt-0.5">CRM · {ROLE_LABELS[user.role]}</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to.split("/").length === 2}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="px-3 py-2 text-sm text-white/70 truncate">{user.name}</div>
        <NavLink
          to="/change-password"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          Change Password
        </NavLink>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
