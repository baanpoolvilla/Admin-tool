// =============================================================
// app/admin/ical/page.tsx — iCal Sync Management
// จัดการ export/import iCal กับ Smart Order และ PMS อื่น
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { useProperties } from "@/hooks/useProperties";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { PropertyWithStats } from "@/types";

interface ImportRecord {
  propertyCode: string;
  propertyName: string;
  url: string;
  importedAt: string;
  count: number;
  dates?: string[];
}

export default function ICalPage() {
  const { properties, isLoading } = useProperties();
  const [origin, setOrigin] = useState("");

  // Export
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Import
  const [importCode, setImportCode] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [history, setHistory] = useState<ImportRecord[]>([]);

  useEffect(() => {
    setOrigin(window.location.origin);
    const saved = localStorage.getItem("ical-import-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const activeProperties = properties.filter(
    (p): p is PropertyWithStats & { property_code: string } =>
      p.is_active && !!p.property_code
  );

  // --- Copy export URL ---
  const handleCopy = (code: string, url: string) => {
    navigator.clipboard.writeText(url).catch(() => {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // --- Import from Smart Order ---
  const handleImport = async () => {
    if (!importCode || !importUrl) return;
    setImporting(true);
    setImportResult(null);

    try {
      const resp = await fetch("/api/ical/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_code: importCode, url: importUrl }),
      });
      const data = await resp.json();

      if (resp.ok) {
        setImportResult({ ok: true, msg: data.message });

        const prop = activeProperties.find((p) => p.property_code === importCode);
        const record: ImportRecord = {
          propertyCode: importCode,
          propertyName: prop?.name ?? importCode,
          url: importUrl,
          importedAt: new Date().toISOString(),
          count: data.imported,
          dates: data.dates ?? [],
        };
        const next = [record, ...history].slice(0, 20);
        setHistory(next);
        localStorage.setItem("ical-import-history", JSON.stringify(next));
        setImportUrl("");
      } else {
        setImportResult({ ok: false, msg: data.error || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setImportResult({ ok: false, msg: "ไม่สามารถเชื่อมต่อได้" });
    } finally {
      setImporting(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("ical-import-history");
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          📅 iCal Sync
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          เชื่อมข้อมูลการจองกับ Smart Order และ PMS อื่นๆ ผ่าน iCal
        </p>
      </div>

      {/* How it works */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-semibold text-orange-900">วิธีใช้งาน 2 ทิศทาง</p>
        <div className="grid md:grid-cols-2 gap-3 text-orange-800">
          <div className="bg-white/60 rounded-lg p-3 space-y-1">
            <p className="font-medium">① ส่งออก → ให้ Smart Order ดึง</p>
            <p className="text-xs">
              Copy URL ของบ้านแล้วนำไปกรอกใน
              Smart Order → ช่องทาง → iCal → <strong>นำเข้า</strong>
              <br />Smart Order จะ poll ทุก 1 ชม. อัตโนมัติ
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3 space-y-1">
            <p className="font-medium">② นำเข้า ← ดึงจาก Smart Order</p>
            <p className="text-xs">
              Copy URL จาก Smart Order → ช่องทาง → iCal →{" "}
              <strong>ส่งออก</strong>
              <br />แล้ววางด้านล่าง กด นำเข้า
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          EXPORT SECTION
      ============================================================ */}
      <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-text-primary font-semibold">
            ① ส่งออก — URL สำหรับให้ Smart Order ดึง
          </h2>
          <p className="text-text-secondary text-xs mt-0.5">
            วันที่ <span className="font-medium">booked</span> และ{" "}
            <span className="font-medium">blocked</span>{" "}
            จะถูกส่งออกเป็น iCal ให้ระบบ PMS ภายนอก poll ได้
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : activeProperties.length === 0 ? (
          <p className="p-6 text-center text-text-secondary text-sm">
            ยังไม่มีบ้านพักที่มีรหัส (property_code) — ไปตั้งค่าที่หน้า
            Properties ก่อน
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 text-text-secondary font-medium">
                    บ้านพัก
                  </th>
                  <th className="text-left p-3 text-text-secondary font-medium">
                    รหัส
                  </th>
                  <th className="text-left p-3 text-text-secondary font-medium">
                    iCal Export URL
                  </th>
                  <th className="p-3 text-text-secondary font-medium text-right">
                    Copy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeProperties.map((p) => {
                  const icalUrl = `${origin}/api/ical/${p.property_code}`;
                  const copied = copiedCode === p.property_code;
                  return (
                    <tr key={p.id} className="hover:bg-card/50 transition-colors">
                      <td className="p-3 text-text-primary font-medium">
                        {p.name}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-orange-50 text-accent rounded text-xs font-mono">
                          {p.property_code}
                        </span>
                      </td>
                      <td className="p-3">
                        <code className="text-xs text-text-secondary break-all">
                          {origin ? icalUrl : "กำลังโหลด..."}
                        </code>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleCopy(p.property_code, icalUrl)}
                          disabled={!origin}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            copied
                              ? "bg-green-50 text-green-600 border border-green-200"
                              : "bg-accent text-white hover:bg-accent/90 disabled:opacity-40"
                          }`}
                        >
                          {copied ? "✓ Copied!" : "Copy URL"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          IMPORT SECTION
      ============================================================ */}
      <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-text-primary font-semibold">
            ② นำเข้า — ดึงวันจองจาก Smart Order
          </h2>
          <p className="text-text-secondary text-xs mt-0.5">
            วาง URL จาก Smart Order → ช่องทาง → iCal → ส่งออก
            แล้วเลือกบ้านที่ตรงกัน
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Property selector */}
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                บ้านพักในระบบเรา
              </label>
              <select
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">— เลือกบ้าน —</option>
                {activeProperties.map((p) => (
                  <option key={p.id} value={p.property_code}>
                    {p.name} ({p.property_code})
                  </option>
                ))}
              </select>
            </div>

            {/* URL input */}
            <div className="md:col-span-2">
              <label className="block text-xs text-text-secondary mb-1">
                iCal URL จาก Smart Order
              </label>
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://www.smartorder.ai/icalendar/.../exported.ics"
                className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={!importCode || !importUrl || importing}
            className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {importing ? "กำลังนำเข้า..." : "▼ นำเข้าวันจอง"}
          </button>

          {importResult && (
            <p
              className={`text-sm p-3 rounded-lg flex items-start gap-2 ${
                importResult.ok
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <span>{importResult.ok ? "✅" : "❌"}</span>
              <span>{importResult.msg}</span>
            </p>
          )}
        </div>
      </div>

      {/* ============================================================
          IMPORT HISTORY
      ============================================================ */}
      {history.length > 0 && (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-text-primary font-semibold text-sm">
              ประวัติการนำเข้าล่าสุด
            </h2>
            <button
              onClick={clearHistory}
              className="text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              ล้างประวัติ
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {history.map((rec, i) => (
              <div key={i} className="px-4 py-3 text-sm space-y-1.5">
                <div className="flex items-center gap-4">
                  <span className="px-2 py-0.5 bg-orange-50 text-accent rounded text-xs font-mono whitespace-nowrap">
                    {rec.propertyCode}
                  </span>
                  <span className="text-text-primary font-medium truncate max-w-[160px]">
                    {rec.propertyName}
                  </span>
                  <span className="text-text-secondary text-xs truncate flex-1 hidden md:block">
                    {rec.url}
                  </span>
                  <span className="text-green-600 text-xs whitespace-nowrap">
                    +{rec.count} วัน
                  </span>
                  <span className="text-text-secondary text-xs whitespace-nowrap">
                    {new Date(rec.importedAt).toLocaleString("th-TH", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {rec.dates && rec.dates.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-1">
                    {rec.dates.map((d) => (
                      <span
                        key={d}
                        className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-xs font-mono"
                      >
                        {new Date(d + "T00:00:00").toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
