"use client";
import { useState, useEffect } from "react";

const DAILY_LIMIT = 20;
const STORAGE_KEY = "scanops_usage";

function getUsageData() {
  if (typeof window === "undefined") return { count: 0, date: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: "" };
    return JSON.parse(raw);
  } catch {
    return { count: 0, date: "" };
  }
}

function updateUsage(newCount: number) {
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: newCount, date: today }));
}

function getTodayCount(): number {
  const data = getUsageData();
  const today = new Date().toISOString().split("T")[0];
  if (data.date !== today) return 0;
  return data.count;
}

type Result = {
  url: string;
  status: "Indexed" | "Not Indexed" | "Blocked/Captcha" | "Error";
  message: string;
};

export default function Home() {
  const [urls, setUrls] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [usedToday, setUsedToday] = useState(0);
  const [showLimitWall, setShowLimitWall] = useState(false);
  const [urlCount, setUrlCount] = useState(0);

  useEffect(() => {
    setUsedToday(getTodayCount());
  }, []);

  useEffect(() => {
    const count = urls.split("\n").filter((u) => u.trim() !== "").length;
    setUrlCount(count);
  }, [urls]);

  const remaining = DAILY_LIMIT - usedToday;

  const handleCheck = async () => {
    if (!urls.trim()) return alert("Pehle URLs daalo!");

    const urlArray = urls.split("\n").filter((u) => u.trim() !== "");

    if (urlArray.length > remaining) {
      setShowLimitWall(true);
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 100 / (urlArray.length * 5), 90));
      }, 300);

      const response = await fetch("http://127.0.0.1:8000/check-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlArray }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();
      setResults(data.results);

      const newCount = usedToday + urlArray.length;
      updateUsage(newCount);
      setUsedToday(newCount);
    } catch (error) {
      console.error("Backend error:", error);
      alert("Backend server check karein! (http://127.0.0.1:8000)");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleExportCSV = () => {
    if (!results.length) return;
    const header = "URL,Status,Message\n";
    const rows = results
      .map((r) => `"${r.url}","${r.status}","${r.message}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scanops-results-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const indexedCount = results.filter((r) => r.status === "Indexed").length;
  const notIndexedCount = results.filter((r) => r.status === "Not Indexed").length;
  const errorCount = results.filter(
    (r) => r.status === "Blocked/Captcha" || r.status === "Error"
  ).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600 opacity-10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Free Tool — No Login Required
          </div>
          <h1 className="text-6xl font-black tracking-tight mb-3">
            <span className="text-blue-500">Scan</span>
            <span className="text-blue-500">Ops</span>
            <span className="text-slate-600">.app</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Bulk Google Indexing Checker — GSC se zyada fast, zyada smart
          </p>
        </div>

        {/* Usage Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-slate-400 text-sm whitespace-nowrap">
              Daily Usage
            </span>
            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(usedToday / DAILY_LIMIT) * 100}%` }}
              />
            </div>
            <span className={`text-sm font-bold whitespace-nowrap ${remaining <= 5 ? "text-red-400" : "text-slate-300"}`}>
              {usedToday}/{DAILY_LIMIT} used
            </span>
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">
            {remaining} remaining today
          </div>
        </div>

        {/* Limit Wall */}
        {showLimitWall && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6 text-center">
            <div className="text-3xl mb-3">🚧</div>
            <h3 className="text-amber-400 font-bold text-lg mb-2">
              Daily Limit Reached!
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Free plan mein sirf {DAILY_LIMIT} URLs/day check kar sakte ho.
              Zyada check karne ke liye kal wapas aao ya Pro plan lo.
            </p>
            <button
              onClick={() => setShowLimitWall(false)}
              className="text-xs text-slate-500 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-slate-300">
              URLs Enter Karo{" "}
              <span className="text-slate-500 font-normal">(ek line mein ek URL)</span>
            </label>
            {urlCount > 0 && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${urlCount > remaining ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                {urlCount} URLs {urlCount > remaining ? `(limit: ${remaining})` : ""}
              </span>
            )}
          </div>

          <textarea
            className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl p-5 h-48 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500 transition-colors font-mono"
            placeholder={`https://example.com/\nhttps://example.com/blog/post-1\nhttps://example.com/about`}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
          />

          {/* Progress Bar */}
          {loading && (
            <div className="mt-4 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <button
            onClick={handleCheck}
            disabled={loading || remaining === 0}
            className="mt-5 w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-bold text-lg transition-all duration-200 relative overflow-hidden group"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Google se check ho raha hai...
              </span>
            ) : remaining === 0 ? (
              "Daily Limit Khatam — Kal Wapas Aao"
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Check Indexing Now
              </span>
            )}
          </button>
        </div>

        {/* Stats Row */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-green-400">{indexedCount}</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">✅ Indexed</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-red-400">{notIndexedCount}</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">❌ Not Indexed</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-amber-400">{errorCount}</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">⚠️ Error/Blocked</div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="font-bold text-lg text-slate-200">
                Results — {results.length} URLs checked
              </h2>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Message</th>
                </tr>
              </thead>
              <tbody>
                {results.map((res, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-slate-600 text-sm">{i + 1}</td>
                    <td className="p-4">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-300 hover:text-blue-400 transition-colors font-mono truncate block max-w-xs md:max-w-sm"
                        title={res.url}
                      >
                        {res.url}
                      </a>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                          res.status === "Indexed"
                            ? "bg-green-500/15 text-green-400 border border-green-500/20"
                            : res.status === "Not Indexed"
                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          res.status === "Indexed" ? "bg-green-400" :
                          res.status === "Not Indexed" ? "bg-red-400" : "bg-amber-400"
                        }`} />
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 hidden md:table-cell max-w-xs truncate">
                      {res.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 bg-slate-950/40 text-center text-xs text-slate-600">
              Results are based on Google Custom Search API — 100% accurate
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-700">
          <p>ScanOps.app — Built for SEO Professionals</p>
          <p className="mt-1">Free: 20 URLs/day • No login required • Powered by Google API</p>
        </div>
      </div>
    </div>
  );
}