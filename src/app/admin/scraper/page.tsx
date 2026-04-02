// =============================================================
// app/admin/scraper/page.tsx — Scraper Management Page
// หน้ารวม Scraper: เพิ่มลิงค์ / ดูบ้านทั้งหมด / สถานะ scrape
// รองรับ Deville (หลายหลัง) + PVC (หลังเดียว)
// =============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useProperties } from "@/hooks/useProperties";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface DiscoveredProperty {
  code: string;
  name: string;
  imageUrl: string | null;
  source: "deville" | "poolvillacity";
  alreadyExists: boolean;
}

interface ScrapeLog {
  id: string;
  source: string;
  status: string;
  properties_updated: number;
  dates_updated: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

interface GroupedLink {
  sourceUrl: string;
  source: string;
  properties: {
    id: string;
    name: string;
    source_property_id: string | null;
    is_active: boolean;
    available_days: number;
    thumbnail_url: string | null;
  }[];
}

export default function ScraperPage() {
  const { properties, isLoading, mutate } = useProperties();

  // --- Add Link State ---
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newZone, setNewZone] = useState("pattaya");
  const [discovered, setDiscovered] = useState<DiscoveredProperty[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addStep, setAddStep] = useState<"url" | "select">("url");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // --- Scrape Logs ---
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // --- Trigger Scrape ---
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");

  // --- Workflow Status ---
  interface WorkflowRun {
    id: number;
    status: string;
    conclusion: string | null;
    created_at: string;
    updated_at: string;
    url: string;
  }
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // จัดกลุ่ม properties ตาม source_url
  const groupedLinks: GroupedLink[] = (() => {
    const map = new Map<string, GroupedLink>();
    for (const p of properties) {
      if (!p.source_url || p.source === "manual") continue;
      const key = p.source_url;
      if (!map.has(key)) {
        map.set(key, {
          sourceUrl: key,
          source: p.source,
          properties: [],
        });
      }
      map.get(key)!.properties.push({
        id: p.id,
        name: p.name,
        source_property_id: p.source_property_id,
        is_active: p.is_active,
        available_days: p.available_days,
        thumbnail_url: p.thumbnail_url,
      });
    }
    return Array.from(map.values());
  })();

  // โหลด scrape logs
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const resp = await fetch("/api/scrape/logs");
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data);
      }
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // โหลด workflow status
  const loadStatus = useCallback(async () => {
    try {
      const resp = await fetch("/api/scrape/status");
      if (resp.ok) {
        const data = await resp.json();
        setWorkflowRuns(data.runs || []);
        return data.runs || [];
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  useEffect(() => {
    loadLogs();
    loadStatus();
  }, [loadLogs, loadStatus]);

  // Auto-poll when workflow is in progress
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(async () => {
      const runs = await loadStatus();
      const latest = runs[0];
      if (latest && latest.status === "completed") {
        setIsPolling(false);
        loadLogs();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isPolling, loadStatus, loadLogs]);

  // --- Discover ---
  const handleDiscover = async () => {
    setAddError("");
    setAddLoading(true);
    try {
      const resp = await fetch(
        `/api/properties/discover?url=${encodeURIComponent(newUrl)}`
      );
      const data = await resp.json();
      if (!resp.ok) {
        setAddError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setDiscovered(data.properties);
      const newCodes = data.properties
        .filter((p: DiscoveredProperty) => !p.alreadyExists)
        .map((p: DiscoveredProperty) => p.code);
      setSelected(new Set(newCodes));
      setAddStep("select");
    } catch {
      setAddError("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setAddLoading(false);
    }
  };

  // --- Import Create ---
  const handleImportCreate = async () => {
    const toCreate = discovered.filter(
      (p) => selected.has(p.code) && !p.alreadyExists
    );
    if (toCreate.length === 0) {
      setAddError("ไม่มีบ้านที่เลือก");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const resp = await fetch("/api/properties/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: toCreate,
          zone: newZone,
          sourceUrl: newUrl,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAddError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setAddSuccess(`นำเข้าสำเร็จ ${data.created} หลัง`);
      mutate();
      setTimeout(() => {
        setShowAdd(false);
        resetAdd();
      }, 1500);
    } catch {
      setAddError("ไม่สามารถสร้างได้");
    } finally {
      setAddLoading(false);
    }
  };

  // --- Trigger Manual Scrape ---
  const handleTriggerScrape = async () => {
    setTriggerLoading(true);
    setTriggerMsg("");
    try {
      const resp = await fetch("/api/scrape/trigger", { method: "POST" });
      const data = await resp.json();
      if (resp.ok) {
        setTriggerMsg("✅ เริ่ม scrape แล้ว — กำลังติดตามสถานะ...");
        setIsPolling(true);
        // Wait a moment for GitHub to register the run, then load status
        setTimeout(() => loadStatus(), 3000);
      } else {
        setTriggerMsg(`❌ ${data.error || "ไม่สามารถเริ่มได้"}`);
      }
    } catch {
      setTriggerMsg("❌ ไม่สามารถเชื่อมต่อ");
    } finally {
      setTriggerLoading(false);
    }
  };

  const resetAdd = () => {
    setNewUrl("");
    setDiscovered([]);
    setSelected(new Set());
    setAddStep("url");
    setAddError("");
    setAddSuccess("");
    setNewZone("pattaya");
  };

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // --- Delete all properties under a source_url ---
  const handleDeleteLink = async (sourceUrl: string, count: number) => {
    if (
      !confirm(
        `ลบบ้านทั้ง ${count} หลังจากลิงค์นี้?\n${sourceUrl}`
      )
    )
      return;

    const propsToDelete = properties.filter(
      (p) => p.source_url === sourceUrl
    );
    for (const p of propsToDelete) {
      await fetch(`/api/properties/${p.id}`, { method: "DELETE" });
    }
    mutate();
  };

  const getSourceBadge = (source: string) => {
    if (source === "deville")
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400">
          Deville
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
        PVC
      </span>
    );
  };

  const totalScraperProps = properties.filter(
    (p) => p.source === "deville" || p.source === "poolvillacity"
  ).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            🔗 จัดการ Scraper
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {groupedLinks.length} ลิงค์ · {totalScraperProps} หลัง ·
            ดึงอัตโนมัติทุก 12 ชม.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTriggerScrape}
            disabled={triggerLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {triggerLoading ? "กำลังส่ง..." : "▶ Scrape ตอนนี้"}
          </button>
          <button
            onClick={() => {
              setShowAdd(true);
              resetAdd();
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            + เพิ่มลิงค์
          </button>
        </div>
      </div>

      {triggerMsg && (
        <p
          className={`text-sm p-3 rounded-lg ${
            triggerMsg.startsWith("✅")
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {triggerMsg}
        </p>
      )}

      {/* Workflow Status Panel */}
      {workflowRuns.length > 0 && (
        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-text-primary font-semibold text-sm">
              ⚡ สถานะ Workflow ล่าสุด
            </h2>
            <div className="flex items-center gap-2">
              {isPolling && (
                <span className="text-xs text-yellow-400 animate-pulse">
                  ● กำลังติดตาม...
                </span>
              )}
              <button
                onClick={loadStatus}
                className="text-xs text-accent hover:text-accent/80"
              >
                🔄 รีเฟรช
              </button>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {workflowRuns.map((run) => {
              const isRunning = run.status === "queued" || run.status === "in_progress";
              const statusLabel =
                run.status === "completed"
                  ? run.conclusion === "success"
                    ? "สำเร็จ"
                    : run.conclusion === "failure"
                    ? "ล้มเหลว"
                    : run.conclusion === "cancelled"
                    ? "ยกเลิก"
                    : run.conclusion || "จบ"
                  : run.status === "in_progress"
                  ? "กำลังทำงาน..."
                  : run.status === "queued"
                  ? "รอคิว..."
                  : run.status;
              const statusColor =
                run.status === "completed" && run.conclusion === "success"
                  ? "bg-green-500/20 text-green-400"
                  : isRunning
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400";

              return (
                <div
                  key={run.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor} ${
                      isRunning ? "animate-pulse" : ""
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(run.created_at).toLocaleString("th-TH")}
                  </span>
                  <a
                    href={run.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline ml-auto"
                  >
                    ดู Log →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-text-primary">
                เพิ่มลิงค์ Scraper
              </h2>
              <button
                onClick={() => {
                  setShowAdd(false);
                  resetAdd();
                }}
                className="text-text-secondary hover:text-text-primary text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {addStep === "url" && (
                <>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="วาง URL จาก Deville หรือ Pool Villa City"
                      className="w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      รองรับ: devillegroups.com (หลายหลัง) · poolvillacity.co.th
                      (หลังเดียว)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      โซน
                    </label>
                    <select
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="bangsaen">บางแสน</option>
                      <option value="pattaya">พัทยา</option>
                      <option value="sattahip">สัตหีบ</option>
                      <option value="rayong">ระยอง</option>
                    </select>
                  </div>
                  <button
                    onClick={handleDiscover}
                    disabled={!newUrl || addLoading}
                    className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                  >
                    {addLoading ? "กำลังค้นหา..." : "🔍 ค้นหาบ้านพัก"}
                  </button>
                </>
              )}

              {addStep === "select" && (
                <>
                  <p className="text-sm text-text-secondary">
                    พบ {discovered.length} หลัง — เลือกบ้านที่ต้องการนำเข้า
                  </p>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {discovered.map((p) => (
                      <label
                        key={p.code}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          p.alreadyExists
                            ? "border-white/5 bg-card/30 opacity-50"
                            : selected.has(p.code)
                            ? "border-accent/50 bg-accent/10"
                            : "border-white/10 bg-card hover:border-white/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(p.code)}
                          onChange={() => toggleSelect(p.code)}
                          disabled={p.alreadyExists}
                          className="accent-accent w-4 h-4"
                        />
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary font-medium truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {p.code}
                            {p.alreadyExists && (
                              <span className="ml-2 text-yellow-400">
                                (มีอยู่แล้ว)
                              </span>
                            )}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddStep("url")}
                      className="flex-1 py-2 bg-card text-text-secondary rounded-lg text-sm hover:bg-card/80 transition-colors"
                    >
                      ← กลับ
                    </button>
                    <button
                      onClick={handleImportCreate}
                      disabled={selected.size === 0 || addLoading}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50 transition-colors"
                    >
                      {addLoading
                        ? "กำลังนำเข้า..."
                        : `✅ นำเข้า ${
                            Array.from(selected).filter(
                              (c) =>
                                !discovered.find((d) => d.code === c)
                                  ?.alreadyExists
                            ).length
                          } หลัง`}
                    </button>
                  </div>
                </>
              )}

              {addError && (
                <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded">
                  {addError}
                </p>
              )}
              {addSuccess && (
                <p className="text-sm text-green-400 bg-green-500/10 p-2 rounded">
                  {addSuccess}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Links List */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : groupedLinks.length === 0 ? (
        <div className="bg-surface rounded-xl border border-white/5 p-12 text-center">
          <p className="text-text-secondary text-lg mb-2">
            ยังไม่มีลิงค์ Scraper
          </p>
          <p className="text-text-secondary text-sm mb-4">
            เพิ่มลิงค์จาก Deville หรือ Pool Villa City เพื่อดึงข้อมูลอัตโนมัติ
          </p>
          <button
            onClick={() => {
              setShowAdd(true);
              resetAdd();
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium"
          >
            + เพิ่มลิงค์แรก
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedLinks.map((link) => (
            <div
              key={link.sourceUrl}
              className="bg-surface rounded-xl border border-white/5 overflow-hidden"
            >
              {/* Link Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getSourceBadge(link.source)}
                  <a
                    href={link.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-primary hover:text-accent truncate"
                    title={link.sourceUrl}
                  >
                    {link.sourceUrl}
                  </a>
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    {link.properties.length} หลัง
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleDeleteLink(
                      link.sourceUrl,
                      link.properties.length
                    )
                  }
                  className="text-red-400 hover:text-red-300 text-xs ml-2 whitespace-nowrap"
                >
                  ลบทั้งหมด
                </button>
              </div>

              {/* Properties under this link */}
              <div className="divide-y divide-white/5">
                {link.properties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {p.thumbnail_url ? (
                      <img
                        src={p.thumbnail_url}
                        alt={p.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-card flex items-center justify-center text-text-secondary text-xs">
                        🏠
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {p.source_property_id}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        p.available_days > 0
                          ? "text-available"
                          : "text-booked"
                      }`}
                    >
                      {p.available_days} วันว่าง
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        p.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {p.is_active ? "Active" : "Off"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scrape Logs */}
      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-text-primary font-semibold text-sm">
            📋 ประวัติ Scrape ล่าสุด
          </h2>
          <button
            onClick={loadLogs}
            disabled={logsLoading}
            className="text-xs text-accent hover:text-accent/80"
          >
            {logsLoading ? "โหลด..." : "🔄 รีเฟรช"}
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-6">
            ยังไม่มีประวัติ
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-3 text-text-secondary font-medium">
                  เวลา
                </th>
                <th className="text-left p-3 text-text-secondary font-medium">
                  สถานะ
                </th>
                <th className="text-left p-3 text-text-secondary font-medium">
                  Properties
                </th>
                <th className="text-left p-3 text-text-secondary font-medium">
                  วันที่อัปเดต
                </th>
                <th className="text-left p-3 text-text-secondary font-medium">
                  ข้อผิดพลาด
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5"
                >
                  <td className="p-3 text-text-secondary text-xs">
                    {new Date(log.started_at).toLocaleString("th-TH")}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        log.status === "success"
                          ? "bg-green-500/20 text-green-400"
                          : log.status === "partial"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-text-primary">
                    {log.properties_updated}
                  </td>
                  <td className="p-3 text-text-primary">
                    {log.dates_updated}
                  </td>
                  <td className="p-3 text-red-400 text-xs truncate max-w-[200px]">
                    {log.error_message || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
