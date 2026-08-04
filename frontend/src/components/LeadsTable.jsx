import React from "react";

const STATUS_STYLES = {
  new: "bg-slate-100 text-slate-600",
  contacted: "bg-blue-100 text-blue-700",
  follow_up: "bg-amber-100 text-amber-700",
  converted: "bg-brand-100 text-brand-700",
  not_interested: "bg-rose-100 text-rose-700",
  invalid: "bg-slate-200 text-slate-500",
};

export default function LeadsTable({ leads, onOpen, selectedLeadIds = [], onToggleSelect }) {
  if (!leads?.length) {
    return (
      <div className="card p-10 text-center text-slate-500 text-sm">
        No leads here yet.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-3 py-3 w-10">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                onChange={(e) => {
                  if (!onToggleSelect) return;
                  if (e.target.checked) {
                    leads.forEach((lead) => onToggleSelect(lead._id));
                  } else {
                    leads.forEach((lead) => onToggleSelect(lead._id));
                  }
                }}
              />
            </th>
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Mobile</th>
            <th className="text-left px-4 py-3">Program / Domain</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Calls</th>
            <th className="text-left px-4 py-3">Paid</th>
            <th className="text-left px-4 py-3">Assigned To</th>
            <th className="text-left px-4 py-3">Last Contact</th>
            <th className="text-left px-4 py-3">Next Follow-up</th>
            <th className="text-left px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead._id}
              onClick={() => onOpen(lead)}
              className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
            >
              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={selectedLeadIds.includes(lead._id)}
                  onChange={() => onToggleSelect && onToggleSelect(lead._id)}
                />
              </td>
              <td className="px-4 py-3 font-medium text-ink">{lead.name}</td>
              <td className="px-4 py-3 text-slate-600">{lead.mobile}</td>
              <td className="px-4 py-3 text-slate-600">
                {lead.program || "—"} {lead.domain ? `/ ${lead.domain}` : ""}
              </td>
              <td className="px-4 py-3">
                <span className={`badge ${STATUS_STYLES[lead.status] || "bg-slate-100 text-slate-600"}`}>
                  {lead.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{lead.callAttemptCount || 0}</td>
              <td className="px-4 py-3 text-slate-600">
                {lead.totalPaidAmount ? `₹${lead.totalPaidAmount.toLocaleString("en-IN")}` : "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {lead.employeeId?.name || lead.teamLeadId?.name || lead.asstManagerId?.name || lead.managerId?.name || "Unassigned"}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString("en-IN") : "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString("en-IN") : "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
