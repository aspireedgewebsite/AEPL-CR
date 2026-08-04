import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import UserFormModal from "../components/UserFormModal";
import api from "../services/api";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";

export default function UsersPage({ title = "Team & Users" }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [parentOptions, setParentOptions] = useState({ asst_manager: [], team_lead: [] });

  const load = async () => {
    setLoading(true);
    const res = await api.get("/users");
    setUsers(res.data.users);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    Promise.all([
      api.get("/users", { params: { role: "asst_manager" } }),
      api.get("/users", { params: { role: "team_lead" } }),
    ])
      .then(([asstRes, leadRes]) => {
        setParentOptions({
          asst_manager: asstRes.data.users,
          team_lead: leadRes.data.users,
        });
      })
      .catch(() => setParentOptions({ asst_manager: [], team_lead: [] }));
  }, []);

  const canCreate = ["super_admin", "manager", "asst_manager"].includes(user.role);

  const groupedTeams = useMemo(() => {
    const groups = new Map();

    const ensureGroup = (teamName) => {
      if (!groups.has(teamName)) {
        groups.set(teamName, {
          teamName,
          asstManager: null,
          teamLeads: [],
          employees: [],
        });
      }
      return groups.get(teamName);
    };

    users.forEach((u) => {
      if (u.role === "asst_manager") {
        const teamName = u.teamName || `${u.name}'s Team`;
        ensureGroup(teamName).asstManager = u;
        return;
      }

      if (u.role === "team_lead") {
        const teamName = u.teamName || u.parentId?.teamName || `${u.parentId?.name || "Unassigned"}'s Team`;
        const group = ensureGroup(teamName);
        group.teamLeads.push(u);
        return;
      }

      if (u.role === "employee") {
        const teamName = u.teamName || u.parentId?.teamName || `${u.parentId?.name || "Unassigned"}'s Team`;
        ensureGroup(teamName).employees.push(u);
      }
    });

    return [...groups.values()];
  }, [users]);

  const toggleActive = async (u) => {
    const res = await api.put(`/users/${u._id}`, { isActive: !u.isActive });
    setUsers(users.map((x) => (x._id === u._id ? res.data.user : x)));
  };

  const reassignParent = async (u, parentId) => {
    try {
      const res = await api.put(`/users/${u._id}`, { parentId });
      setUsers(users.map((x) => (x._id === u._id ? res.data.user : x)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reassign user");
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    await api.delete(`/users/${u._id}`);
    setUsers(users.filter((x) => x._id !== u._id));
  };

  return (
    <div>
      <Navbar
        title={title}
        subtitle={`${users.length} member${users.length === 1 ? "" : "s"}`}
        action={canCreate ? <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Member</button> : null}
      />
      <div className="p-8">
        {loading ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : (
          <>
            {['super_admin', 'manager'].includes(user.role) && groupedTeams.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
                {groupedTeams.map((team) => (
                  <div key={team.teamName} className="card p-4">
                    <div className="text-base font-semibold text-ink mb-3">{team.teamName}</div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div>
                        <span className="font-medium text-slate-500">Asst. Manager:</span>{" "}
                        {team.asstManager?.name || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Team Leads:</span>{" "}
                        {team.teamLeads.length ? team.teamLeads.map((lead) => lead.name).join(", ") : "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Employees:</span>{" "}
                        {team.employees.length ? team.employees.map((emp) => emp.name).join(", ") : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Team Name</th>
                  <th className="text-left px-4 py-3">Reports To</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[u.role]}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.teamName || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.role === "manager" && u.role === "team_lead" ? (
                        <select
                          className="input text-xs py-1"
                          value={u.parentId?._id || ""}
                          onChange={(e) => reassignParent(u, e.target.value)}
                        >
                          <option value="">Select Asst. Manager</option>
                          {parentOptions.asst_manager.map((opt) => (
                            <option key={opt._id} value={opt._id}>{opt.name}</option>
                          ))}
                        </select>
                      ) : user.role === "manager" && u.role === "employee" ? (
                        <select
                          className="input text-xs py-1"
                          value={u.parentId?._id || ""}
                          onChange={(e) => reassignParent(u, e.target.value)}
                        >
                          <option value="">Select Team Lead</option>
                          {parentOptions.team_lead.map((opt) => (
                            <option key={opt._id} value={opt._id}>{opt.name}</option>
                          ))}
                        </select>
                      ) : user.role === "asst_manager" && u.role === "employee" ? (
                        <select
                          className="input text-xs py-1"
                          value={u.parentId?._id || ""}
                          onChange={(e) => reassignParent(u, e.target.value)}
                        >
                          <option value="">Select Team Lead</option>
                          {parentOptions.team_lead.map((opt) => (
                            <option key={opt._id} value={opt._id}>{opt.name}</option>
                          ))}
                        </select>
                      ) : (
                        u.parentId?.name || "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isActive ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-500"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      {canCreate && (
                        <button onClick={() => toggleActive(u)} className="text-xs font-medium text-slate-500 hover:text-ink">
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                      {user.role === "super_admin" && (
                        <button onClick={() => deleteUser(u)} className="text-xs font-medium text-rose-500 hover:text-rose-700">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {showForm && <UserFormModal onClose={() => setShowForm(false)} onCreated={() => load()} />}
    </div>
  );
}
