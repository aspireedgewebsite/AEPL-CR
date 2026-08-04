import React, { useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

export default function LeadFormModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", program: "", domain: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/leads", form);
      onCreated(res.data.lead);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add New Lead" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="text-xs font-medium text-slate-500">Name *</label>
          <input className="input mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Mobile *</label>
          <input className="input mt-1" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Email</label>
          <input className="input mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Program</label>
            <input className="input mt-1" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Domain</label>
            <input className="input mt-1" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Lead"}</button>
        </div>
      </form>
    </Modal>
  );
}
