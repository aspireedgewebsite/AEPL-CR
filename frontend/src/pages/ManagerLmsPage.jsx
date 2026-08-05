import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LeadsTable from "../components/LeadsTable";
import LeadDetailModal from "../components/LeadDetailModal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ManagerLmsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await api.get("/leads", { params: { converted: true, lmsRequested: true, q: query || undefined } });
    setLeads(res.data.leads.filter((l) => !l.sentToOperation));
    setLoading(false);
  };

  useEffect(() => { load(); }, [query]);

  const visibleLeads = leads.filter((l) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (l.name || "").toLowerCase().includes(q) ||
      (l.mobile || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <Navbar
        title="Send to Operation (LMS)"
        subtitle={user.role === "asst_manager" ? "Converted leads waiting for your approval to send to operation" : "Fully converted leads ready to hand off — open a lead and use 'Send to Operation'"}
      />
      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            className="input max-w-sm"
            placeholder="Search by name, mobile, or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : (
          <LeadsTable leads={visibleLeads} onOpen={setSelected} />
        )}
      </div>
      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => load()}
        />
      )}
    </div>
  );
}
