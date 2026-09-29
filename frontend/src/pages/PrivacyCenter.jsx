import React, { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, Server, Download, Upload, Trash2, CheckCircle2, Lock, AlertTriangle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function PrivacyCenter() {
  const { user, privacyMode, setPrivacyMode, logout } = useAuth();
  const nav = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const importInput = useRef(null);

  const download = async () => {
    setDownloading(true);
    try {
      const { data } = await api.get("/privacy/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careerlens_data_export_${user?.name?.toLowerCase().replace(/\s+/g, "_") || "user"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Successfully exported full JSON archive of your account data.");
    } catch (e) {
      toast.error("Export failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setDownloading(false);
    }
  };

  const importArchive = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("JSON archive exceeds the 10 MB import limit.");
      return;
    }

    let archive;
    try {
      archive = JSON.parse(await file.text());
    } catch {
      toast.error("This file is not valid JSON.");
      return;
    }

    if (!archive || typeof archive !== "object" || Array.isArray(archive) || !archive.user?.id) {
      toast.error("Choose a valid CareerLens JSON export.");
      return;
    }
    if (!window.confirm("Merge this archive into your current account? Existing data will be kept, and duplicate records will be skipped.")) {
      return;
    }

    setImporting(true);
    try {
      const { data } = await api.post("/privacy/import", { archive });
      const imported = Object.values(data.collections || {}).reduce((total, item) => total + item.imported, 0);
      toast.success(`Import complete. ${imported} records merged into your account.`);
    } catch (e) {
      toast.error("Import failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setImporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account and all associated resumes, scores, and mock interview transcripts? This action CANNOT be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/users/me");
      logout();
      toast.success("All personal data permanently deleted from CareerLens.");
      nav("/login");
    } catch (e) {
      toast.error("Deletion failed: " + (e.response?.data?.detail || e.message));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="privacy-page">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          Privacy Center & Data Sovereignty
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Your data. Your choices. Local by default (Mode A) with transparent encrypted sync (Mode B).
        </p>
      </div>

      {/* Mode A / B Toggle Card */}
      <Card className="p-6 border-slate-200 bg-white shadow-xs space-y-4" data-testid="privacy-mode-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 border ${
                privacyMode === "A"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
              }`}
            >
              {privacyMode === "A" ? <Shield className="w-6 h-6" /> : <Server className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                Active Architecture:{" "}
                <span className={privacyMode === "A" ? "text-emerald-700" : "text-indigo-600"}>
                  {privacyMode === "A" ? "Mode A (Local On-Device)" : "Mode B (Encrypted Server AI)"}
                </span>
              </div>
              <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                {privacyMode === "A"
                  ? "Resumes are parsed 100% inside your browser using a local Web Worker. Only calculated metrics and anonymous skill gap codes are processed. Raw resume text never touches a server."
                  : "Enables cloud synchronization and enhanced Gemini 3 Flash career critiques with strict rate-limiting to preserve free API quotas. Every server call is clearly badged in the UI."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 self-start">
            <span className={`text-xs font-semibold ${privacyMode === "A" ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
              Mode A (Local)
            </span>
            <Switch
              data-testid="privacy-mode-toggle"
              checked={privacyMode === "B"}
              onCheckedChange={(checked) => {
                const next = checked ? "B" : "A";
                setPrivacyMode(next);
                toast.success(`Switched to ${next === "A" ? "Mode A (Local Only)" : "Mode B (Server AI)"}`);
              }}
            />
            <span className={`text-xs font-semibold ${privacyMode === "B" ? "text-indigo-700 font-bold" : "text-slate-400"}`}>
              Mode B (Server AI)
            </span>
          </div>
        </div>
      </Card>

      {/* Data Management Actions */}
      <Card className="p-6 border-slate-200 bg-white shadow-xs space-y-4" data-testid="privacy-actions-card">
        <div className="font-bold text-slate-900 text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>
          User Data Controls
        </div>
        <p className="text-sm text-slate-600">
          In alignment with GDPR and privacy best practices, you maintain full control to inspect, export, or destroy your data.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            data-testid="btn-download-data"
            onClick={download}
            disabled={downloading}
            variant="outline"
            className="border-slate-300 hover:border-indigo-300 hover:text-indigo-600 font-medium"
          >
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download My Data (Full JSON)
          </Button>

          <input
            ref={importInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            data-testid="privacy-import-file"
            onChange={importArchive}
          />
          <Button
            data-testid="btn-import-data"
            onClick={() => importInput.current?.click()}
            disabled={importing}
            variant="outline"
            className="border-slate-300 hover:border-indigo-300 hover:text-indigo-600 font-medium"
          >
            {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Merge Previous JSON
          </Button>

          <Button
            data-testid="btn-delete-account"
            onClick={deleteAccount}
            disabled={deleting}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 font-medium"
          >
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Permanently Delete Account & Transcripts
          </Button>
        </div>
      </Card>

      {/* Privacy Guarantees */}
      <Card className="p-6 border-slate-200 bg-white shadow-xs space-y-3" data-testid="privacy-guarantees-card">
        <div className="font-bold text-slate-900 text-lg flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          <Lock className="w-4 h-4 text-indigo-600" />
          Our Architectural Guarantees
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-slate-700 pt-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Never store or log plaintext passwords (Argon2 hashing enforced).</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Mode A processes resumes 100% client-side in a Web Worker.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Mode B is strictly opt-in with visible UI badges and rate-limiting.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>One-click complete purge of all database and analytics records.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
