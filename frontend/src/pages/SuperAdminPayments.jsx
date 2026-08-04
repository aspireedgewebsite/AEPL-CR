import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function SuperAdminPayments() {
  const [payments, setPayments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    const res = await api.get("/payments");
    setPayments(res.data.payments);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditingId(p._id);
    setEditForm({ amount: p.amount, utr: p.utr, invoiceNumber: p.invoiceNumber || "" });
  };

  const saveEdit = async (id) => {
    const res = await api.put(`/payments/${id}`, editForm);
    setPayments(payments.map((p) => (p._id === id ? res.data.payment : p)));
    setEditingId(null);
  };

  const remove = async (id) => {
    if (!confirm("Delete this payment record? This cannot be undone.")) return;
    await api.delete(`/payments/${id}`);
    setPayments(payments.filter((p) => p._id !== id));
  };

  return (
    <div>
      <Navbar title="All Payments" subtitle="Super Admin has full edit & delete access" />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Lead</th>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">UTR</th>
                <th className="text-left px-4 py-3">Invoice #</th>
                <th className="text-left px-4 py-3">Locked</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{p.leadId?.name}</td>
                  <td className="px-4 py-3">{p.installmentNumber}</td>
                  <td className="px-4 py-3">
                    {editingId === p._id ? (
                      <input className="input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                    ) : (
                      `₹${p.amount.toLocaleString("en-IN")}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === p._id ? (
                      <input className="input" value={editForm.utr} onChange={(e) => setEditForm({ ...editForm, utr: e.target.value })} />
                    ) : (
                      p.utr
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === p._id ? (
                      <input className="input" value={editForm.invoiceNumber} onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })} />
                    ) : (
                      p.invoiceNumber || "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{p.locked ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {editingId === p._id ? (
                      <>
                        <button onClick={() => saveEdit(p._id)} className="text-xs font-medium text-brand-600 hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs font-medium text-slate-500 hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(p)} className="text-xs font-medium text-brand-600 hover:underline">Edit</button>
                        <button onClick={() => remove(p._id)} className="text-xs font-medium text-rose-500 hover:underline">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
