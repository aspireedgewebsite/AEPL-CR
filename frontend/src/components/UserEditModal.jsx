import React, { useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

export default function UserEditModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    teamName: user.teamName || "",
    monthlyTarget: user.monthlyTarget || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { name: form.name, phone: form.phone };
    if (user.role === "asst_manager") payload.teamName = form.teamName;
    if (["super_admin", "manager"].includes(user.role)) payload.monthlyTarget = Number(form.monthlyTarget || 0);
    if (form.password) payload.password = form.password;

    try {
      const res = await api.put(`/users/${user._id}`, payload);
      onUpdated(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="text-xs font-medium text-slate-500">Role</label>
          <div className="input mt-1 bg-slate-50 text-slate-500 capitalize">{user.role.replace("_", " ")}</div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Full Name *</label>
          <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Email</label>
          <div className="input mt-1 bg-slate-50 text-slate-500">{user.email}</div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Phone</label>
          <input className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        {user.role === "asst_manager" && (
          <div>
            <label className="text-xs font-medium text-slate-500">Team Name</label>
            <input className="input mt-1" value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} />
          </div>
        )}
        {["super_admin", "manager"].includes(user.role) && (
          <div>
            <label className="text-xs font-medium text-slate-500">Monthly Target</label>
            <input type="number" min="0" className="input mt-1" value={form.monthlyTarget} onChange={(e) => setForm({ ...form, monthlyTarget: e.target.value })} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-slate-500">Reset Password (optional)</label>
          <input type="password" minLength={6} className="input mt-1" placeholder="Leave blank to keep current" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </Modal>
  );
}
