import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function OperationPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoiceDrafts, setInvoiceDrafts] = useState({});

  const load = async () => {
    const res = await api.get("/payments/operation");
    setPayments(res.data.payments);
  };

  useEffect(() => { load(); }, []);

  const submitInvoice = async (id) => {
    const invoiceNumber = invoiceDrafts[id];
    if (!invoiceNumber) return;
    const res = await api.put(`/payments/${id}/invoice`, { invoiceNumber });
    setPayments(payments.map((p) => (p._id === id ? res.data.payment : p)));
  };

  return (
    <div>
<Navbar title="Payments & Invoices" subtitle="Each payment submitted by Sales appears here for invoicing" />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Lead</th>
                <th className="text-left px-4 py-3">Mobile</th>
                <th className="text-left px-4 py-3">Program / Domain</th>
                <th className="text-left px-4 py-3">Installment</th>
                <th className="text-left px-4 py-3">Amount (Received)</th>
                <th className="text-left px-4 py-3">Finalized</th>
                <th className="text-left px-4 py-3">Pending</th>
                <th className="text-left px-4 py-3">Invoice #</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{p.leadId?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.leadId?.mobile}</td>
                  <td className="px-4 py-3 text-slate-600">{p.leadId?.program} / {p.leadId?.domain}</td>
                  <td className="px-4 py-3">#{p.installmentNumber}</td>
                  <td className="px-4 py-3">₹{p.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.leadId?.totalAgreedAmount ? `₹${p.leadId.totalAgreedAmount.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.leadId?.totalAgreedAmount
                      ? `₹${Math.max(0, p.leadId.totalAgreedAmount - p.leadId.totalPaidAmount).toLocaleString("en-IN")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.locked ? (
                      <span className="font-medium text-ink">{p.invoiceNumber}</span>
                    ) : (
                      <input
                        className="input"
                        placeholder="Enter invoice #"
                        value={invoiceDrafts[p._id] || ""}
                        onChange={(e) => setInvoiceDrafts({ ...invoiceDrafts, [p._id]: e.target.value })}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!p.locked && (
                      <button onClick={() => submitInvoice(p._id)} className="btn-primary text-xs px-3 py-1.5">
                        Submit Invoice
                      </button>
                    )}
                    {p.locked && <span className="text-xs text-slate-400">Locked</span>}
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
