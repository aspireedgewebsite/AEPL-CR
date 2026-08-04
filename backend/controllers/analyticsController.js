const Lead = require("../models/Lead");
const User = require("../models/User");
const CallLog = require("../models/CallLog");
const { leadVisibilityFilter } = require("../utils/hierarchy");

// The "open" stages that still represent an active pipeline (not terminal).
const OPEN_STATUSES = ["new", "contacted", "follow_up"];

// GET /api/analytics/followups
// Overdue / due-today follow-ups for the requesting user's scope.
// Dedicated endpoint (not a client filter of all leads).
const getFollowUpAlerts = async (req, res) => {
  try {
    const filter = await leadVisibilityFilter(req.user);
    filter.isDeleted = false;
    filter.status = { $in: OPEN_STATUSES };
    filter.nextFollowUpDate = { $ne: null };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [dueToday, overdue] = await Promise.all([
      Lead.find({
        ...filter,
        nextFollowUpDate: { $gte: today, $lt: tomorrow },
      })
        .sort({ nextFollowUpDate: 1 })
        .populate("employeeId teamLeadId asstManagerId managerId", "name role"),
      Lead.find({
        ...filter,
        nextFollowUpDate: { $lt: today },
      })
        .sort({ nextFollowUpDate: 1 })
        .populate("employeeId teamLeadId asstManagerId managerId", "name role"),
    ]);

    res.json({
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      dueToday,
      overdue,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/funnel
// Aggregate lead counts by stage/status with stage-to-stage conversion %.
const getFunnel = async (req, res) => {
  try {
    const filter = await leadVisibilityFilter(req.user);
    filter.isDeleted = false;

    const stages = ["new", "contacted", "follow_up", "converted", "not_interested", "invalid"];
    const rows = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(rows.map((r) => [r._id, r.count || 0]));

    // Order stages as defined; compute stage-to-stage conversion %.
    const funnel = stages.map((status, index) => {
      const count = countMap[status] || 0;
      const prevCount = index === 0 ? null : countMap[stages[index - 1]] || 0;
      const conversionRate =
        index === 0
          ? 100
          : prevCount
          ? Number(((count / prevCount) * 100).toFixed(1))
          : 0;
      return { status, count, conversionRate };
    });

    const total = funnel.reduce((sum, s) => sum + s.count, 0);
    res.json({ total, funnel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/leaderboard
// Per sales-rep conversion leaderboard. Reps see their own; admins see all.
// Grouped by employee / team_lead / asst_manager with avg time-to-convert.
const getLeaderboard = async (req, res) => {
  try {
    const filter = await leadVisibilityFilter(req.user);
    filter.isDeleted = false;

    // Non-admin roles: scope to themselves only.
    if (["employee", "team_lead", "asst_manager"].includes(req.user.role)) {
      const field = {
        employee: "employeeId",
        team_lead: "teamLeadId",
        asst_manager: "asstManagerId",
      }[req.user.role];
      filter[field] = req.user._id;
    }

    const groupBy = async (field, role) => {
      const rows = await Lead.aggregate([
        { $match: filter },
        {
          $group: {
            _id: `$${field}`,
            totalLeads: { $sum: 1 },
            converted: { $sum: { $cond: ["$converted", 1, 0] } },
            firstCreatedAt: { $min: "$createdAt" },
            convertedAt: { $max: { $cond: ["$converted", "$updatedAt", null] } },
          },
        },
      ]);

      const ids = rows.map((r) => r._id).filter(Boolean);
      const users = await User.find({ _id: { $in: ids }, isDeleted: false }).select("name role");
      const nameMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

      return rows
        .map((row) => {
          const user = nameMap[String(row._id)];
          if (!user) return null;
          const conversionRate = row.totalLeads ? Number(((row.converted / row.totalLeads) * 100).toFixed(1)) : 0;
          // avg time-to-convert (days) across converted leads where we have a convertedAt timestamp
          let avgTimeToConvert = 0;
          if (row.converted && row.firstCreatedAt && row.convertedAt) {
            avgTimeToConvert = Number(
              ((new Date(row.convertedAt) - new Date(row.firstCreatedAt)) / (1000 * 60 * 60 * 24)).toFixed(1)
            );
          }
          return {
            id: String(row._id),
            name: user.name,
            role,
            totalLeads: row.totalLeads,
            converted: row.converted,
            conversionRate,
            avgTimeToConvert,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.conversionRate - a.conversionRate || b.converted - a.converted);
    };

    res.json({
      employee: await groupBy("employeeId", "employee"),
      teamLead: await groupBy("teamLeadId", "team_lead"),
      asstManager: await groupBy("asstManagerId", "asst_manager"),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/source-performance
// Group by lead source: volume, conversion rate, avg deal value.
const getSourcePerformance = async (req, res) => {
  try {
    const filter = await leadVisibilityFilter(req.user);
    filter.isDeleted = false;

    const rows = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$source",
          totalLeads: { $sum: 1 },
          converted: { $sum: { $cond: ["$converted", 1, 0] } },
          totalAgreed: { $sum: "$totalAgreedAmount" },
        },
      },
    ]);

    const sources = rows.map((item) => ({
      source: item._id || "unknown",
      totalLeads: item.totalLeads,
      converted: item.converted,
      conversionRate: item.totalLeads ? Number(((item.converted / item.totalLeads) * 100).toFixed(1)) : 0,
      avgDealValue: item.converted ? Number((item.totalAgreed / item.converted).toFixed(2)) : 0,
    }));

    res.json({ sources });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/targets
// Target vs achieved, built on the existing User.monthlyTarget concept.
const getTargetTracker = async (req, res) => {
  try {
    const filter = await leadVisibilityFilter(req.user);
    filter.isDeleted = false;

    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const monthlyTargetLeads = await User.find({ isDeleted: false, monthlyTarget: { $gt: 0 } }).select("name role monthlyTarget");
    const teamSummary = await Promise.all(
      monthlyTargetLeads.map(async (user) => {
        const leadCount = await Lead.countDocuments({
          ...filter,
          createdAt: { $gte: start, $lt: end },
          $or: [{ employeeId: user._id }, { teamLeadId: user._id }, { asstManagerId: user._id }, { managerId: user._id }],
        });
        const convertedCount = await Lead.countDocuments({
          ...filter,
          createdAt: { $gte: start, $lt: end },
          converted: true,
          $or: [{ employeeId: user._id }, { teamLeadId: user._id }, { asstManagerId: user._id }, { managerId: user._id }],
        });
        return {
          user: user.name,
          role: user.role,
          monthlyTarget: user.monthlyTarget || 0,
          achieved: leadCount,
          achievedRate: user.monthlyTarget ? Number(((leadCount / user.monthlyTarget) * 100).toFixed(1)) : 0,
          conversions: convertedCount,
        };
      })
    );

    res.json({ year, month, teamSummary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getFollowUpAlerts,
  getFunnel,
  getLeaderboard,
  getSourcePerformance,
  getTargetTracker,
};
