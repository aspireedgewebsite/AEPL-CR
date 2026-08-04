import React from "react";

export default function Navbar({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
