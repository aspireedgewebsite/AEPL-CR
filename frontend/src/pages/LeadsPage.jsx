import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LeadsTable from "../components/LeadsTable";
import LeadFormModal from "../components/LeadFormModal";
import BulkUploadModal from "../components/BulkUploadModal";
import BulkAssignModal from "../components/BulkAssignModal";
import LeadDetailModal from "../components/LeadDetailModal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LeadsPage({ title = "Leads", subtitle }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [assignedRoleFilter, setAssignedRoleFilter] = useState("all");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  const load = async () => {
    setLoading(true);
    const res = await api.get("/leads", { params: query ? { q: query } : {} });
    setLeads(res.data.leads);
    setLoading(false);
  };

  useEffect(() => { load(); }, [query]);

  useEffect(() => {
    api
      .get("/users")
      .then((res) => setAllUsers(res.data.users || []))
      .catch(() => setAllUsers([]));
  }, []);

  const canUpload = ["super_admin", "manager", "asst_manager"].includes(user.role);
  const canCreate = ["super_admin", "manager", "asst_manager", "team_lead", "employee"].includes(user.role);
const canBulkAssign = ["super_admin", "manager", "asst_manager", "team_lead"].includes(user.role);
  const canBulkDelete = ["super_admin", "manager"].includes(user.role);

  const roleFieldMap = {
    manager: "managerId",
    asst_manager: "asstManagerId",
    team_lead: "teamLeadId",
    employee: "employeeId",
  };

  const assignedRoleUsers = allUsers.filter((u) => assignedRoleFilter === "all" || u.role === assignedRoleFilter);

  useEffect(() => {
    if (assignedRoleFilter === "all") {
      setAssignedUserFilter("");
      return;
    }
    const hasSelectedUser = assignedRoleUsers.some((u) => String(u._id) === String(assignedUserFilter));
    if (assignedUserFilter && !hasSelectedUser) {
      setAssignedUserFilter("");
    }
  }, [assignedRoleFilter, assignedRoleUsers, assignedUserFilter]);

  const visibleLeads = leads.filter((lead) => {
    const isAssigned = Boolean(lead.managerId || lead.asstManagerId || lead.teamLeadId || lead.employeeId);
    const selectedRoleField = roleFieldMap[assignedRoleFilter];
    const selectedRoleLead = selectedRoleField ? lead[selectedRoleField] : null;
    const selectedRoleUserId = selectedRoleLead?._id || selectedRoleLead || null;

    const roleMatch = assignedRoleFilter === "all" ? true : Boolean(selectedRoleLead);
    const userMatch = !assignedUserFilter || String(selectedRoleUserId) === String(assignedUserFilter);

    if (assignmentFilter === "assigned") {
      return isAssigned && roleMatch && userMatch;
    }
    if (assignmentFilter === "unassigned") {
      return !isAssigned && roleMatch && userMatch;
    }
    return roleMatch && userMatch;
  });

  const convertedCount = visibleLeads.filter((lead) => lead.converted).length;

  const handleBulkDelete = async () => {
    if (!selectedLeadIds.length) return;
    if (!window.confirm(`Delete ${selectedLeadIds.length} selected lead(s)?`)) return;

    try {
      await api.delete("/leads/bulk", { data: { leadIds: selectedLeadIds } });
      setSelectedLeadIds([]);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete selected leads");
    }
  };

  return (
    <div>
      <Navbar
        title={title}
        subtitle={subtitle || `${visibleLeads.length} lead${visibleLeads.length === 1 ? "" : "s"} • ${convertedCount} converted`}
        action={
          <div className="flex gap-2">
            {canUpload && <button className="btn-secondary" onClick={() => setShowBulk(true)}>Bulk Upload</button>}
            {canBulkAssign && selectedLeadIds.length > 0 && (
              <button className="btn-secondary" onClick={() => setShowBulkAssign(true)}>Bulk Assign ({selectedLeadIds.length})</button>
            )}
            {canBulkDelete && selectedLeadIds.length > 0 && (
              <button className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleBulkDelete}>Bulk Delete ({selectedLeadIds.length})</button>
            )}
            {canCreate && <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Lead</button>}
          </div>
        }
      />
      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            className="input max-w-sm"
            placeholder="Search by name, mobile, or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="input max-w-xs" value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)}>
            <option value="all">All Leads</option>
            <option value="assigned">Assigned Leads</option>
            <option value="unassigned">Unassigned Leads</option>
          </select>
          <select className="input max-w-xs" value={assignedRoleFilter} onChange={(e) => setAssignedRoleFilter(e.target.value)}>
            <option value="all">All Assigned Roles</option>
            <option value="manager">Manager</option>
            <option value="asst_manager">Asst Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="employee">Employee</option>
          </select>
          <select
            className="input max-w-xs"
            value={assignedUserFilter}
            onChange={(e) => setAssignedUserFilter(e.target.value)}
            disabled={assignedRoleFilter === "all"}
          >
            <option value="">All Users in Role</option>
            {assignedRoleUsers.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-slate-500 text-sm">Loading leads...</div>
        ) : (
          <LeadsTable
            leads={visibleLeads}
            onOpen={setSelected}
            selectedLeadIds={selectedLeadIds}
            onToggleSelect={(leadId) => {
              setSelectedLeadIds((prev) =>
                prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
              );
            }}
          />
        )}
      </div>

      {showForm && <LeadFormModal onClose={() => setShowForm(false)} onCreated={() => load()} />}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onDone={() => load()} />}
      {showBulkAssign && (
        <BulkAssignModal
          leadIds={selectedLeadIds}
          onClose={() => setShowBulkAssign(false)}
          onDone={() => {
            setSelectedLeadIds([]);
            load();
          }}
        />
      )}
      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => setLeads(leads.map((l) => (l._id === updated._id ? updated : l)))}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
