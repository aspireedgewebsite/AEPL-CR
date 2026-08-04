import React, { useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

export default function BulkUploadModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/leads/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      onDone && onDone();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Bulk Upload Leads (CSV / Excel)" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500">
          File must have columns: <strong>name, mobile, email, program, domain</strong>. Header names are case-insensitive.
        </p>
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="input"
        />
        {result && (
          <div className="text-sm bg-brand-50 text-brand-700 rounded-lg px-3 py-2">
            Inserted {result.insertedCount} leads. Skipped {result.skippedCount}.
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          <button type="submit" className="btn-primary" disabled={uploading || !file}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
