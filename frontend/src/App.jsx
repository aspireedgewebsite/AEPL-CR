import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, ROLE_HOME } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import LeadsPage from "./pages/LeadsPage";
import UsersPage from "./pages/UsersPage";
import RoleOverview from "./pages/RoleOverview";
import SuperAdminOverview from "./pages/SuperAdminOverview";
import SuperAdminPayments from "./pages/SuperAdminPayments";
import ManagerLmsPage from "./pages/ManagerLmsPage";
import OperationOverview from "./pages/OperationOverview";
import OperationPaymentsPage from "./pages/OperationPaymentsPage";
import OperationLmsPage from "./pages/OperationLmsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/change-password" element={<ProtectedRoute><Layout><ChangePasswordPage /></Layout></ProtectedRoute>} />

      {/* Super Admin */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute roles={["super_admin"]}>
            <Layout><SuperAdminOverview /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/leads"
        element={
          <ProtectedRoute roles={["super_admin"]}>
            <Layout><LeadsPage title="All Leads" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/users"
        element={
          <ProtectedRoute roles={["super_admin"]}>
            <Layout><UsersPage title="All Users" /></Layout>
          </ProtectedRoute>
        }
      />
<Route
        path="/super-admin/payments"
        element={
          <ProtectedRoute roles={["super_admin"]}>
            <Layout><SuperAdminPayments /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/analytics"
        element={
          <ProtectedRoute roles={["super_admin"]}>
            <Layout><AnalyticsDashboard title="Analytics" /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Manager (Admin-1) */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Layout><RoleOverview title="Manager Overview" subtitle="Your team's performance" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/leads"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Layout><LeadsPage title="Leads" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/users"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Layout><UsersPage title="Team & Users" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lms"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Layout><ManagerLmsPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Asst Manager (Admin-2) */}
      <Route
        path="/asst-manager"
        element={
          <ProtectedRoute roles={["asst_manager"]}>
            <Layout><RoleOverview title="Asst. Manager Overview" subtitle="Your team's performance" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/asst-manager/leads"
        element={
          <ProtectedRoute roles={["asst_manager"]}>
            <Layout><LeadsPage title="Leads" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/asst-manager/users"
        element={
          <ProtectedRoute roles={["asst_manager"]}>
            <Layout><UsersPage title="My Team" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/asst-manager/lms"
        element={
          <ProtectedRoute roles={["asst_manager"]}>
            <Layout><ManagerLmsPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Team Lead */}
      <Route
        path="/team-lead"
        element={
          <ProtectedRoute roles={["team_lead"]}>
            <Layout><RoleOverview title="Team Lead Overview" subtitle="Your team's performance" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-lead/leads"
        element={
          <ProtectedRoute roles={["team_lead"]}>
            <Layout><LeadsPage title="Leads" /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Employee */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute roles={["employee"]}>
            <Layout><RoleOverview title="My Overview" subtitle="Your leads & performance" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leads"
        element={
          <ProtectedRoute roles={["employee"]}>
            <Layout><LeadsPage title="My Leads" /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Operation */}
      <Route
        path="/operation"
        element={
          <ProtectedRoute roles={["operation"]}>
            <Layout><OperationOverview /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operation/payments"
        element={
          <ProtectedRoute roles={["operation"]}>
            <Layout><OperationPaymentsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operation/lms"
        element={
          <ProtectedRoute roles={["operation"]}>
            <Layout><OperationLmsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
