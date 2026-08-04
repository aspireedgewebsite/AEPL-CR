import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLE_HOME } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || "/login");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-semibold text-white">Odissitech</div>
          <div className="text-white/50 text-sm mt-1">CRM Login</div>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 space-y-4 shadow-xl">
          {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="text-xs font-medium text-slate-500">Email</label>
            <input required type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Password</label>
            <input required type="password" className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
