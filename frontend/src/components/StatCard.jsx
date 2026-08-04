import React from "react";

export default function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-display font-semibold mt-2 ${accent || "text-ink"}`}>{value}</div>
    </div>
  );
}
