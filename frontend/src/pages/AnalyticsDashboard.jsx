import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function AnalyticsDashboard({ title = "Analytics", subtitle = "Follow-ups, funnel, leaderboard, sources & targets" }) {
  const [alerts, setAlerts] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [sources, setSources] = useState([]);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/followups"),
      api.get("/analytics/funnel"),
      api.get("/analytics/leaderboard"),
      api.get("/analytics/source-performance"),
      api.get("/analytics/targets"),
    ])
      .then(([alertsRes, funnelRes, leaderboardRes, sourcesRes, targetsRes]) => {
        setAlerts(alertsRes.data);
        setFunnel(funnelRes.data);
        setLeaderboard(leaderboardRes.data);
        setSources(sourcesRes.data.sources || []);
        setTargets(targetsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading analytics...</div>;

  return (
    <div>
      <Navbar title={title} subtitle={subtitle} />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Due Today" value={alerts?.dueTodayCount || 0} tone="brand" />
          <Card title="Overdue" value={alerts?.overdueCount || 0} tone="rose" />
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Follow-up Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2">Due Today ({alerts?.dueToday?.length || 0})</h4>
              <div className="space-y-1">
                {alerts?.dueToday?.length ? (
                  alerts.dueToday.map((lead) => (
                    <div key={lead._id} className="text-sm text-slate-600 flex justify-between">
                      <span>{lead.name}</span>
                      <span className="text-slate-400">{new Date(lead.nextFollowUpDate).toLocaleDateString("en-IN")}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">No follow-ups due today.</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2">Overdue ({alerts?.overdue?.length || 0})</h4>
              <div className="space-y-1">
                {alerts?.overdue?.length ? (
                  alerts.overdue.map((lead) => (
                    <div key={lead._id} className="text-sm text-slate-600 flex justify-between">
                      <span>{lead.name}</span>
                      <span className="text-slate-400">{new Date(lead.nextFollowUpDate).toLocaleDateString("en-IN")}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">No overdue follow-ups.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Funnel View</h3>
          <div className="space-y-3">
            {funnel?.funnel?.map((stage) => (
              <div key={stage.status}>
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span className="capitalize">{stage.status.replace("_", " ")}</span>
                  <span>{stage.count} leads</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${Math.max(5, stage.count / Math.max(1, funnel.total) * 100)}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1">Stage conversion: {stage.conversionRate}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Employee Leaderboard">
            {leaderboard?.employee?.slice(0, 5).map((item) => (
              <Row key={item.id} label={item.name} value={`${item.conversionRate}%`} />
            ))}
          </Panel>
          <Panel title="Team Lead Leaderboard">
            {leaderboard?.teamLead?.slice(0, 5).map((item) => (
              <Row key={item.id} label={item.name} value={`${item.conversionRate}%`} />
            ))}
          </Panel>
          <Panel title="Asst. Manager Leaderboard">
            {leaderboard?.asstManager?.slice(0, 5).map((item) => (
              <Row key={item.id} label={item.name} value={`${item.conversionRate}%`} />
            ))}
          </Panel>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Source Performance</h3>
          <div className="space-y-2">
            {sources.map((item) => (
              <div key={item.source || "unknown"} className="flex justify-between text-sm text-slate-600">
                <span className="capitalize">{item.source || "Unknown"}</span>
                <span>{item.totalLeads} leads · {item.conversionRate}% conv · avg ₹{item.avgDealValue || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Target vs Achieved</h3>
          <div className="space-y-3">
            {targets?.teamSummary?.map((item, index) => (
              <div key={`${item.user}-${index}`}>
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{item.user} ({item.role})</span>
                  <span>{item.achieved}/{item.monthlyTarget}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min(100, item.achievedRate)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, tone = "brand" }) {
  const toneMap = {
    brand: "bg-brand-50 text-brand-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="card p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneMap[tone] || toneMap.brand}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-ink mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
