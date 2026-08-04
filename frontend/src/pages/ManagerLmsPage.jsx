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

  const load = async () => {
    setLoading(true);
    const res = await api.get("/leads", { params: { converted: true, lmsRequested: true } });
    setLeads(res.data.leads.filter((l) => !l.sentToOperation));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <Navbar
        title="Send to Operation (LMS)"
        subtitle={user.role === "asst_manager" ? "Converted leads waiting for your approval to send to operation" : "Fully converted leads ready to hand off — open a lead and use 'Send to Operation'"}
      />
      <div className="p-8">
        {loading ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : (
          <LeadsTable leads={leads} onOpen={setSelected} />
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
