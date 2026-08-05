import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const TABS = ["Details", "Calls", "Payments", "Assign"];

export default function LeadDetailModal({ lead, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("Details");
  const [current, setCurrent] = useState(lead);
  const [calls, setCalls] = useState([]);
  const [payments, setPayments] = useState([]);
  const [assignOptions, setAssignOptions] = useState([]);
  const [error, setError] = useState("");

  const refreshLead = async () => {
    const res = await api.get(`/leads/${current._id}`);
    setCurrent(res.data.lead);
    onUpdated && onUpdated(res.data.lead);
  };

  useEffect(() => {
    api.get(`/calls/lead/${current._id}`).then((r) => setCalls(r.data.callLogs));
    api.get(`/payments/lead/${current._id}`).then((r) => setPayments(r.data.payments));
    const roleToFetch =
      user.role === "manager" ? "asst_manager" : user.role === "asst_manager" ? "team_lead" : user.role === "team_lead" ? "employee" : null;

    if (roleToFetch) {
      api.get(`/users?role=${roleToFetch}`).then((r) => {
        // Show ALL eligible users in the role. A user who already has other leads
        // can still be assigned NEW leads (only the CURRENT lead cannot be reassigned).
        setAssignOptions(r.data.users);
      });
    }
  }, [current._id, user.role]);

  // ----- Calls -----
  const [callForm, setCallForm] = useState({ leadResponse: "", remark: "", statusAfterCall: "", nextFollowUpDate: "" });
  const submitCall = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/calls", { leadId: current._id, ...callForm });
      setCalls([res.data.callLog, ...calls]);
      setCallForm({ leadResponse: "", remark: "", statusAfterCall: "", nextFollowUpDate: "" });
      refreshLead();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log call");
    }
  };

// ----- Payments -----
  const [payForm, setPayForm] = useState({
    amount: "",
    agreedAmount: current.totalAgreedAmount || "",
    program: current.program || "",
    domain: current.domain || "",
    utr: "",
  });
  const submitPayment = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {};
    if (payForm.amount !== "") payload.amount = payForm.amount;
    if (payForm.agreedAmount !== "") payload.agreedAmount = payForm.agreedAmount;
    if (payForm.program) payload.program = payForm.program;
    if (payForm.domain) payload.domain = payForm.domain;
    if (payForm.utr) payload.utr = payForm.utr;
    try {
      const res = await api.post("/payments", { leadId: current._id, ...payload });
      setPayments([...payments, res.data.payment]);
      setCurrent(res.data.lead);
      onUpdated && onUpdated(res.data.lead);
      setPayForm({ amount: "", agreedAmount: res.data.lead.totalAgreedAmount || "", program: res.data.lead.program || "", domain: res.data.lead.domain || "", utr: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add payment");
    }
  };

  const sendPaymentToOperation = async (paymentId) => {
    try {
      const res = await api.put(`/payments/${paymentId}/send-to-operation`);
      setPayments(payments.map((p) => (p._id === paymentId ? res.data.payment : p)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send to Operation");
    }
  };

  // ----- Assign -----
  const [assignTarget, setAssignTarget] = useState("");
  const submitAssign = async (e) => {
    e.preventDefault();
    setError("");
    const field =
      user.role === "manager" ? "asstManagerId" : user.role === "asst_manager" ? "teamLeadId" : user.role === "team_lead" ? "employeeId" : null;
    if (!field || !assignTarget) return;
    try {
      const res = await api.put(`/leads/${current._id}/assign`, { [field]: assignTarget });
      setCurrent(res.data.lead);
      onUpdated && onUpdated(res.data.lead);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign");
    }
  };

  // ----- LMS handoff -----
  const sendToLms = async () => {
    try {
      const res = await api.put(`/leads/${current._id}/send-to-lms`);
      setCurrent(res.data.lead);
      onUpdated && onUpdated(res.data.lead);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send to LMS");
    }
  };

  const canAssign =
    (user.role === "manager" && !current.asstManagerId) ||
    (user.role === "asst_manager" && !current.teamLeadId) ||
    (user.role === "team_lead" && !current.employeeId);
  const canAddPayment = ["manager", "asst_manager", "team_lead", "employee"].includes(user.role) && current.installmentsCount < 10;
  const canSendToLms = ["employee", "team_lead", "asst_manager", "manager"].includes(user.role) && current.converted && !current.lmsRequested && !current.sentToOperation;
  const canApproveToOperation = ["asst_manager", "manager"].includes(user.role) && current.converted && current.lmsRequested && !current.sentToOperation;
  const canDelete = ["super_admin", "manager"].includes(user.role);

  const deleteLead = async () => {
    if (!window.confirm(`Delete lead ${current.name}?`)) return;
    try {
      await api.delete(`/leads/${current._id}`);
      onDeleted && onDeleted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete lead");
    }
  };

  return (
    <Modal title={current.name} onClose={onClose} wide>
      <div className="text-sm text-slate-500 mb-4">
        {current.mobile} {current.email ? `· ${current.email}` : ""} · {current.program || "No program"} / {current.domain || "No domain"}
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">{error}</div>}

      {tab === "Details" && (
        <div className="space-y-3 text-sm">
          {canDelete && (
            <button onClick={deleteLead} className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50">
              Delete Lead
            </button>
          )}
<div className="grid grid-cols-2 gap-3">
            <Info label="Status" value={current.status.replace("_", " ")} />
            <Info label="Final Amount (Agreed)" value={`₹${(current.totalAgreedAmount || 0).toLocaleString("en-IN")}`} />
            <Info label="Total Paid" value={`₹${(current.totalPaidAmount || 0).toLocaleString("en-IN")}`} />
            <Info label="Pending" value={`₹${Math.max(0, (current.totalAgreedAmount || 0) - (current.totalPaidAmount || 0)).toLocaleString("en-IN")}`} />
            <Info label="Installments" value={`${current.installmentsCount} / 10`} />
            <Info label="Source" value={current.source} />
          </div>
          {canSendToLms && (
            <button onClick={sendToLms} className="btn-primary mt-3">
              Send Converted Lead to LMS Queue
            </button>
          )}
          {canApproveToOperation && (
            <button onClick={sendToLms} className="btn-secondary mt-3">
              Send to Operation
            </button>
          )}
          {current.lmsRequested && !current.sentToOperation && (
            <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">
              Sent to LMS queue. Awaiting asst manager approval.
            </div>
          )}
          {current.sentToOperation && (
            <div className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2 mt-3">
              Sent to Operation on {new Date(current.sentToOperationAt).toLocaleDateString("en-IN")}
            </div>
          )}
        </div>
      )}

      {tab === "Calls" && (
        <div className="space-y-4">
          <form onSubmit={submitCall} className="card p-4 space-y-2">
            <label className="text-xs font-medium text-slate-500">What did the lead say?</label>
            <textarea
              required
              className="input"
              rows={2}
              value={callForm.leadResponse}
              onChange={(e) => setCallForm({ ...callForm, leadResponse: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="input"
                value={callForm.statusAfterCall}
                onChange={(e) => setCallForm({ ...callForm, statusAfterCall: e.target.value })}
              >
                <option value="">Status after call (optional)</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow up</option>
                <option value="converted">Converted</option>
                <option value="not_interested">Not interested</option>
                <option value="invalid">Invalid</option>
              </select>
              <input
                type="date"
                className="input"
                value={callForm.nextFollowUpDate}
                onChange={(e) => setCallForm({ ...callForm, nextFollowUpDate: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="Remark (optional)"
              value={callForm.remark}
              onChange={(e) => setCallForm({ ...callForm, remark: e.target.value })}
            />
            <button type="submit" className="btn-primary">Log Call</button>
          </form>

          <div className="space-y-2">
            {calls.map((c) => (
              <div key={c._id} className="card p-3 text-sm">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{c.calledBy?.name} ({c.calledBy?.role})</span>
                  <span>{new Date(c.callDate).toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1 text-ink">"{c.leadResponse}"</div>
                {c.remark && <div className="text-slate-500 mt-0.5">Remark: {c.remark}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Payments" && (
        <div className="space-y-4">
          {canAddPayment && (
<form onSubmit={submitPayment} className="card p-4 grid grid-cols-2 gap-2">
              <input required type="number" min="0" className="input" placeholder="Final Amount (Agreed)" value={payForm.agreedAmount} onChange={(e) => setPayForm({ ...payForm, agreedAmount: e.target.value })} />
              <input required type="number" min="0" className="input" placeholder="Amount Paid" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              <input required className="input" placeholder="Program" value={payForm.program} onChange={(e) => setPayForm({ ...payForm, program: e.target.value })} />
              <input required className="input" placeholder="Domain" value={payForm.domain} onChange={(e) => setPayForm({ ...payForm, domain: e.target.value })} />
              <input required className="input" placeholder="UTR number" value={payForm.utr} onChange={(e) => setPayForm({ ...payForm, utr: e.target.value })} />
              <div className="col-span-2 text-xs text-slate-500">
                Pending after this payment: ₹{Math.max(0, (Number(payForm.agreedAmount) || 0) - (current.totalPaidAmount || 0) - (Number(payForm.amount) || 0)).toLocaleString("en-IN")}
              </div>
              <button type="submit" className="btn-primary col-span-2">
                Add Payment (Installment #{current.installmentsCount + 1} of 10)
              </button>
            </form>
          )}
          {!canAddPayment && current.installmentsCount >= 10 && (
            <div className="text-sm text-slate-500">Maximum of 10 payment submissions reached for this lead.</div>
          )}

          <table className="w-full text-sm card overflow-hidden">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">UTR</th>
                <th className="text-left px-3 py-2">Sent to Ops</th>
                <th className="text-left px-3 py-2">Invoice #</th>
                <th className="text-left px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{p.installmentNumber}</td>
                  <td className="px-3 py-2">₹{p.amount.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">{p.utr}</td>
                  <td className="px-3 py-2">{p.sentToOperation ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{p.invoiceNumber || "—"}</td>
                  <td className="px-3 py-2">
                    {user.role === "manager" && !p.sentToOperation && (
                      <button onClick={() => sendPaymentToOperation(p._id)} className="text-brand-600 hover:underline text-xs font-medium">
                        Send to Operation
                      </button>
                    )}
                    {p.locked && <span className="text-xs text-slate-400">Locked</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Assign" && (
        <div className="space-y-3">
          {canAssign ? (
            <form onSubmit={submitAssign} className="flex gap-2">
              <select className="input" value={assignTarget} onChange={(e) => setAssignTarget(e.target.value)}>
                <option value="">Select team member...</option>
                {assignOptions.map((o) => (
                  <option key={o._id} value={o._id}>{o.name} ({o.role})</option>
                ))}
              </select>
              <button type="submit" className="btn-primary whitespace-nowrap">Assign</button>
            </form>
          ) : (
            <div className="text-sm text-slate-500">This lead is already assigned and cannot be assigned again.</div>
          )}
          <div className="text-sm text-slate-600 space-y-1 mt-3">
            <div>Manager: {current.managerId?.name || "—"}</div>
            <div>Asst. Manager: {current.asstManagerId?.name || "—"}</div>
            <div>Team Lead: {current.teamLeadId?.name || "—"}</div>
            <div>Employee: {current.employeeId?.name || "—"}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium text-ink capitalize">{value}</div>
    </div>
  );
}

