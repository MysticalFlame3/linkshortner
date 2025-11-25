'use client';

import { useEffect, useState } from 'react';

type Link = {
  code: string;
  targetUrl: string;
  totalClicks: number;
  lastClickedAt: string | null;
  createdAt: string;
};

export default function HomePage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // later we'll add: form states for creating links, search, delete etc.

  useEffect(() => {
    async function fetchLinks() {
      try {
        setLoading(true);
        const res = await fetch('/api/links');
        if (!res.ok) {
          throw new Error('Failed to load links');
        }
        const data = await res.json();
        setLinks(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Could not load links. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchLinks();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            TinyLink Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Manage your short links and view basic stats.
          </p>
        </header>

        {/* States */}
        {loading && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            Loading links…
          </div>
        )}

        {error && !loading && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && links.length === 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            No links yet. Create your first short link using the form (we’ll add
            it next).
          </div>
        )}

        {!loading && !error && links.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Short code</th>
                  <th className="px-4 py-3">Target URL</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Last clicked</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr
                    key={link.code}
                    className="border-t border-slate-800/80 hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-sky-300">
                      {link.code}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <div className="truncate text-xs text-slate-200">
                        {link.targetUrl}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-200">
                      {link.totalClicks}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {link.lastClickedAt
                        ? new Date(link.lastClickedAt).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {/* we’ll hook these up in next steps */}
                      <span className="inline-flex gap-2">
                        <button
                          disabled
                          className="cursor-not-allowed rounded-md border border-slate-700/70 px-2 py-1 text-[11px] text-slate-300 opacity-60"
                        >
                          Copy
                        </button>
                        <button
                          disabled
                          className="cursor-not-allowed rounded-md border border-red-500/40 px-2 py-1 text-[11px] text-red-200/80 opacity-60"
                        >
                          Delete
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
