import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function OperationLmsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await api.get("/operation/leads");
    setLeads(res.data.leads);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doAction = async (leadId, action) => {
    const res = await api.put(`/leads/${leadId}/lms-action`, { action });
    setLeads(leads.map((l) => (l._id === leadId ? res.data.lead : l)));
  };

  return (
    <div>
      <Navbar title="LMS" subtitle="Leads handed off by Manager after full payment" />
      <div className="p-8">
        {loading ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Mobile</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Program / Domain</th>
                  <th className="text-left px-4 py-3">Total Paid</th>
                  <th className="text-left px-4 py-3">Offer Letter</th>
                  <th className="text-left px-4 py-3">LMS Access</th>
                  <th className="text-left px-4 py-3">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-ink">{l.name}</td>
                    <td className="px-4 py-3 text-slate-600">{l.mobile}</td>
                    <td className="px-4 py-3 text-slate-600">{l.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{l.program} / {l.domain}</td>
                    <td className="px-4 py-3 text-slate-600">₹{(l.totalPaidAmount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <LmsButton done={l.lms.offerLetterSent} onClick={() => doAction(l._id, "offerLetter")} label="Send Offer Letter" doneLabel="Sent" />
                    </td>
                    <td className="px-4 py-3">
                      <LmsButton done={l.lms.lmsAccessGranted} onClick={() => doAction(l._id, "lmsAccess")} label="Grant Access" doneLabel="Granted" />
                    </td>
                    <td className="px-4 py-3">
                      <LmsButton done={l.lms.certificateSent} onClick={() => doAction(l._id, "certificate")} label="Send Certificate" doneLabel="Sent" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LmsButton({ done, onClick, label, doneLabel }) {
  if (done) {
    return <span className="badge bg-brand-100 text-brand-700">{doneLabel}</span>;
  }
  return (
    <button onClick={onClick} className="btn-secondary text-xs px-3 py-1.5">
      {label}
    </button>
  );
}
