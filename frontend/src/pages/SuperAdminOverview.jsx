import React, { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import api from "../services/api";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SuperAdminOverview() {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setStats(res.data));
    api.get("/dashboard/yearly").then((res) => setYearly(res.data.data));
  }, []);

  useEffect(() => {
    api.get("/dashboard/monthly", { params: { year } }).then((res) =>
      setMonthly(res.data.data.map((d) => ({ ...d, name: MONTH_NAMES[d.month - 1] })))
    );
  }, [year]);

  return (
    <div>
      <Navbar
        title="Overview & Graphs"
        subtitle="Company-wide performance, month & year wise"
        action={
          <select className="input w-32" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearly.map((y) => (
              <option key={y.year} value={y.year}>{y.year}</option>
            ))}
          </select>
        }
      />
      <div className="p-8 space-y-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Leads" value={stats.totalLeads} />
            <StatCard label="Converted" value={stats.converted} accent="text-brand-600" />
            <StatCard label="New" value={stats.newLeads} />
            <StatCard label="Follow-up" value={stats.followUp} accent="text-amber-600" />
          </div>
        )}

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Leads & Conversions — {year} (Month wise)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7EBEA" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalLeads" name="Total Leads" stroke="#2F7A6F" strokeWidth={2} />
              <Line type="monotone" dataKey="converted" name="Converted" stroke="#C1673F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Revenue — {year} (Month wise)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7EBEA" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
              <Bar dataKey="revenue" name="Revenue" fill="#2F7A6F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Year-wise Trend (last 5 years)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7EBEA" />
              <XAxis dataKey="year" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalLeads" name="Total Leads" fill="#7FB8B0" radius={[6, 6, 0, 0]} />
              <Bar dataKey="converted" name="Converted" fill="#C1673F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
