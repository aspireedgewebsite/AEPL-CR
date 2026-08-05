import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CREATION_OPTIONS = {
  super_admin: ["super_admin", "manager", "asst_manager", "team_lead", "employee", "operation"],
  manager: ["asst_manager", "team_lead", "employee", "operation"],
  asst_manager: ["team_lead", "employee"],
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  manager: "Manager (Admin-1)",
  asst_manager: "Asst. Manager (Admin-2)",
  team_lead: "Team Lead",
  employee: "Employee",
  operation: "Operation",
};

export default function UserFormModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const roleOptions = CREATION_OPTIONS[user.role] || [];
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: roleOptions[0] || "",
    teamName: "",
    parentId: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [parentOptions, setParentOptions] = useState([]);

  useEffect(() => {
    if (!form.role) return;
    const roleToFetch =
      user.role === "manager" && form.role === "team_lead"
        ? "asst_manager"
        : user.role === "manager" && form.role === "employee"
          ? "team_lead"
          : user.role === "asst_manager" && form.role === "employee"
            ? "team_lead"
            : null;

    if (!roleToFetch) {
      setParentOptions([]);
      setForm((prev) => ({ ...prev, parentId: "" }));
      return;
    }

    api
      .get("/users", { params: { role: roleToFetch } })
      .then((res) => setParentOptions(res.data.users))
      .catch(() => setParentOptions([]));
  }, [form.role, user.role]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/users", form);
      onCreated(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Team Member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="text-xs font-medium text-slate-500">Role *</label>
          <select className="input mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Full Name *</label>
          <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Email *</label>
          <input required type="email" className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Phone</label>
          <input className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Temporary Password *</label>
          <input required minLength={6} className="input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {form.role === "asst_manager" && (
          <div>
            <label className="text-xs font-medium text-slate-500">Team Name (optional)</label>
            <input className="input mt-1" value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} />
          </div>
        )}
        {parentOptions.length > 0 && (
          <div>
            <label className="text-xs font-medium text-slate-500">Assign under</label>
            <select className="input mt-1" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">Select parent...</option>
              {parentOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>{opt.name} ({ROLE_LABELS[opt.role]})</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Create User"}</button>
        </div>
      </form>
    </Modal>
  );
}
