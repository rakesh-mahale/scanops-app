"use client";
import { useState } from 'react';

export default function Home() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!urls.trim()) return alert("Pehle URLs toh dalo!");
    
    setLoading(true);
    const urlArray = urls.split('\n').filter(u => u.trim() !== '');

    try {
      const response = await fetch('http://127.0.0.1:8000/check-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlArray }),
      });

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Backend connect nahi ho raha:", error);
      alert("Backend server check karein!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black text-blue-600 mb-2 tracking-tight">ScanOps<span className="text-slate-400">.app</span></h1>
          <p className="text-slate-500 text-lg">Live Indexing Checker for Rakesh</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">
          <textarea 
            className="w-full p-5 border-2 border-slate-100 rounded-2xl h-48 bg-slate-50 mb-4"
            placeholder="https://example.com/page-1"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
          />

          <button 
            onClick={handleCheck}
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all disabled:bg-slate-300"
          >
            {loading ? "Google se puch raha hoon... 🕵️‍♂️" : "Check Indexing Now"}
          </button>
        </div>

        {/* Result Table */}
        {results.length > 0 && (
          <div className="mt-10 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 font-bold">URL</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((res, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4 text-sm truncate max-w-xs">{res.url}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${res.status === 'Indexed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {res.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}