const Lead = require("../models/Lead");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { leadVisibilityFilter } = require("../utils/hierarchy");

// GET /api/dashboard/summary  -> role-scoped quick stats
const getSummary = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month);
    const filter = await leadVisibilityFilter(req.user);
    filter.isDeleted = false;

    if (month && month >= 1 && month <= 12) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.createdAt = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const [totalLeads, converted, newLeads, followUp] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, converted: true }),
      Lead.countDocuments({ ...filter, status: "new" }),
      Lead.countDocuments({ ...filter, status: "follow_up" }),
    ]);

    let revenue = 0;
    const leadIdsAgg = await Lead.find(filter).select("totalPaidAmount");
    revenue = leadIdsAgg.reduce((sum, l) => sum + (l.totalPaidAmount || 0), 0);

    let usersManaged = null;
    if (["super_admin", "manager", "asst_manager", "team_lead"].includes(req.user.role)) {
      usersManaged = await User.countDocuments({ parentId: req.user._id, isDeleted: false });
    }

    res.json({ totalLeads, converted, newLeads, followUp, revenue, usersManaged });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/dashboard/monthly?year=2026   -> super_admin only, month-wise leads/conversions/revenue for a year
const getMonthlyStats = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const leadsByMonth = await Lead.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalLeads: { $sum: 1 },
          converted: { $sum: { $cond: ["$converted", 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueByMonth = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $month: "$paymentDate" },
          revenue: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const data = months.map((m) => {
      const l = leadsByMonth.find((x) => x._id === m);
      const r = revenueByMonth.find((x) => x._id === m);
      return {
        month: m,
        totalLeads: l ? l.totalLeads : 0,
        converted: l ? l.converted : 0,
        revenue: r ? r.revenue : 0,
        paymentCount: r ? r.paymentCount : 0,
      };
    });

    res.json({ year, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/dashboard/daily?month=8&year=2026  -> super_admin only, day-wise leads/conversions/revenue for a month
const getDailyStats = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const leadsByDay = await Lead.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          totalLeads: { $sum: 1 },
          converted: { $sum: { $cond: ["$converted", 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueByDay = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dayOfMonth: "$paymentDate" },
          revenue: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const data = days.map((d) => {
      const l = leadsByDay.find((x) => x._id === d);
      const r = revenueByDay.find((x) => x._id === d);
      return {
        day: d,
        totalLeads: l ? l.totalLeads : 0,
        converted: l ? l.converted : 0,
        revenue: r ? r.revenue : 0,
        paymentCount: r ? r.paymentCount : 0,
      };
    });

    res.json({ year, month, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/dashboard/yearly  -> super_admin only, year-wise totals (last 5 years)
const getYearlyStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

    const leadsByYear = await Lead.aggregate([
      { $group: { _id: { $year: "$createdAt" }, totalLeads: { $sum: 1 }, converted: { $sum: { $cond: ["$converted", 1, 0] } } } },
    ]);
    const revenueByYear = await Payment.aggregate([
      { $group: { _id: { $year: "$paymentDate" }, revenue: { $sum: "$amount" } } },
    ]);

    const data = years.map((y) => {
      const l = leadsByYear.find((x) => x._id === y);
      const r = revenueByYear.find((x) => x._id === y);
      return {
        year: y,
        totalLeads: l ? l.totalLeads : 0,
        converted: l ? l.converted : 0,
        revenue: r ? r.revenue : 0,
      };
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getSummary,
  getMonthlyStats,
  getYearlyStats,
  getDailyStats,
};
