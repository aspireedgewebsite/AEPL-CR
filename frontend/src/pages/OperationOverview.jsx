import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import api from "../services/api";

export default function OperationOverview() {
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    api.get("/payments/operation").then((res) => setPayments(res.data.payments));
    api.get("/operation/leads").then((res) => setLeads(res.data.leads));
  }, []);

  const pendingInvoices = payments.filter((p) => !p.invoiceNumber).length;
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <Navbar title="Operation Overview" subtitle="Payments received and LMS handoffs" />
      <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Payments Received" value={payments.length} />
        <StatCard label="Pending Invoices" value={pendingInvoices} accent="text-amber-600" />
        <StatCard label="Total Amount" value={`₹${totalReceived.toLocaleString("en-IN")}`} accent="text-brand-600" />
        <StatCard label="Leads in LMS" value={leads.length} />
      </div>
    </div>
  );
}
