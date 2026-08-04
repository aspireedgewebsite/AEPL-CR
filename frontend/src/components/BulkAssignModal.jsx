import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import api from "../services/api";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";

const TARGET_ROLE_BY_USER = {
  manager: { role: "asst_manager", label: "Asst. Manager" },
  asst_manager: { role: "team_lead", label: "Team Lead" },
  team_lead: { role: "employee", label: "Employee" },
};

export default function BulkAssignModal({ leadIds, onClose, onDone }) {
  const { user } = useAuth();
  const target = TARGET_ROLE_BY_USER[user.role] || null;
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const payloadKey = useMemo(() => {
    if (user.role === "manager") return "asstManagerId";
    if (user.role === "asst_manager") return "teamLeadId";
    if (user.role === "team_lead") return "employeeId";
    return null;
  }, [user.role]);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    Promise.all([
      api.get("/users", { params: { role: target.role } }),
      api.get("/leads"),
    ])
      .then(([userRes, leadRes]) => {
        const assignedIds = new Set(
          leadRes.data.leads
            .filter((lead) => {
              if (user.role === "manager") return lead.asstManagerId && lead.asstManagerId._id;
              if (user.role === "asst_manager") return lead.teamLeadId && lead.teamLeadId._id;
              if (user.role === "team_lead") return lead.employeeId && lead.employeeId._id;
              return false;
            })
            .map((lead) => {
              if (user.role === "manager") return lead.asstManagerId._id;
              if (user.role === "asst_manager") return lead.teamLeadId._id;
              if (user.role === "team_lead") return lead.employeeId._id;
              return null;
            })
        );

        setOptions(userRes.data.users.filter((opt) => !assignedIds.has(opt._id)));
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [target, user.role]);

  const submit = async (e) => {
    e.preventDefault();
    if (!payloadKey || !selected) {
      setError("Please select a team member to assign.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put("/leads/bulk-assign", {
        leadIds,
        [payloadKey]: selected,
      });
      onDone && onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Bulk assign failed");
    } finally {
      setSaving(false);
    }
  };

  if (!target) return null;

  return (
    <Modal title={`Bulk Assign to ${target.label}`} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <div className="text-sm text-slate-600">
          Assigning <strong>{leadIds.length}</strong> selected lead{leadIds.length === 1 ? "" : "s"} to {ROLE_LABELS[target.role] || target.label}.
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading team members...</div>
        ) : options.length ? (
          <select className="input w-full" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Select {target.label}...</option>
            {options.map((o) => (
              <option key={o._id} value={o._id}>{o.name} ({o.role})</option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-slate-500">No {target.label.toLowerCase()} users are available in your database yet.</div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving || !selected}>
            {saving ? "Assigning..." : "Bulk Assign"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
