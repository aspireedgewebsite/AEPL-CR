import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import api from "../services/api";

const NAV_BY_ROLE = {
  super_admin: [
    { to: "/super-admin", label: "Overview & Graphs" },
    { to: "/super-admin/leads", label: "All Leads" },
    { to: "/super-admin/users", label: "All Users" },
    { to: "/super-admin/payments", label: "All Payments" },
    { to: "/super-admin/analytics", label: "Analytics" },
  ],
  manager: [
    { to: "/manager", label: "Overview" },
    { to: "/manager/leads", label: "Leads" },
    { to: "/manager/users", label: "Team & Users" },
    { to: "/manager/lms", label: "Send to Operation (LMS)" },
    { to: "/manager/analytics", label: "Analytics" },
  ],
  asst_manager: [
    { to: "/asst-manager", label: "Overview" },
    { to: "/asst-manager/leads", label: "Leads" },
    { to: "/asst-manager/users", label: "My Team" },
    { to: "/asst-manager/lms", label: "Send to Operation (LMS)" },
    { to: "/asst-manager/analytics", label: "Analytics" },
  ],
  team_lead: [
    { to: "/team-lead", label: "Overview" },
    { to: "/team-lead/leads", label: "Leads" },
    { to: "/team-lead/analytics", label: "Analytics" },
  ],
  employee: [
    { to: "/employee", label: "Overview" },
    { to: "/employee/leads", label: "My Leads" },
    { to: "/employee/analytics", label: "Analytics" },
  ],
  operation: [
    { to: "/operation", label: "Overview" },
    { to: "/operation/payments", label: "Payments & Invoices" },
    { to: "/operation/lms", label: "LMS" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [followUpCount, setFollowUpCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api
      .get("/analytics/followups")
      .then((res) => setFollowUpCount((res.data.overdueCount || 0) + (res.data.dueTodayCount || 0)))
      .catch(() => setFollowUpCount(0));
  }, [user]);

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
              `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span>{l.label}</span>
            {l.label === "Analytics" && followUpCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-semibold">
                {followUpCount}
              </span>
            )}
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
