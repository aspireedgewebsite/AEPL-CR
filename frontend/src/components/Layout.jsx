import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F7F8F7]">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
