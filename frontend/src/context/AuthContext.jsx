import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  manager: "Manager (Admin-1)",
  asst_manager: "Asst. Manager (Admin-2)",
  team_lead: "Team Lead",
  employee: "Employee",
  operation: "Operation",
};

export const ROLE_HOME = {
  super_admin: "/super-admin",
  manager: "/manager",
  asst_manager: "/asst-manager",
  team_lead: "/team-lead",
  employee: "/employee",
  operation: "/operation",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("odissitech_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("odissitech_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("odissitech_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("odissitech_token");
        localStorage.removeItem("odissitech_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("odissitech_token", res.data.token);
    localStorage.setItem("odissitech_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("odissitech_token");
    localStorage.removeItem("odissitech_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
