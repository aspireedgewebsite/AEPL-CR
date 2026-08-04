import React, { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function ChangePasswordPage({ title = "Change Password", subtitle = "Update your account password" }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match");
      return;
    }

    try {
      setLoading(true);
      await api.put("/auth/change-password", { currentPassword, newPassword });
      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title={title} subtitle={subtitle} />
      <div className="p-8 max-w-xl">
        <form onSubmit={submit} className="card p-6 space-y-4">
          {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
          {message && <div className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">{message}</div>}

          <div>
            <label className="text-xs font-medium text-slate-500">Current Password</label>
            <input type="password" className="input mt-1" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">New Password</label>
            <input type="password" className="input mt-1" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Confirm New Password</label>
            <input type="password" className="input mt-1" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
