import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import api from "../services/api";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RoleOverview({ title, subtitle }) {
  const [stats, setStats] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");

  useEffect(() => {
    api.get("/dashboard/summary", { params: { year, month: month || undefined } }).then((res) => setStats(res.data));
  }, [year, month]);

  return (
    <div>
      <Navbar title={title} subtitle={subtitle} />
      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <select className="input w-32" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className="input w-36" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={String(idx + 1)}>{m}</option>
            ))}
          </select>
        </div>

        {!stats ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Leads" value={stats.totalLeads} />
            <StatCard label="Converted" value={stats.converted} accent="text-brand-600" />
            <StatCard label="New" value={stats.newLeads} />
            <StatCard label="Follow-up" value={stats.followUp} accent="text-amber-600" />
            <StatCard label="Revenue Collected" value={`₹${stats.revenue.toLocaleString("en-IN")}`} accent="text-brand-600" />
            {stats.usersManaged !== null && <StatCard label="Team Members" value={stats.usersManaged} />}
          </div>
        )}
      </div>
    </div>
  );
}
