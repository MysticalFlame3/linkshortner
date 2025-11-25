'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type LinkStats = {
  code: string;
  targetUrl: string;
  totalClicks: number;
  lastClickedAt: string | null;
  createdAt: string;
};

type PageProps = {
  params: Promise<{ code: string }>;
};

export default function CodeStatsPage(props: PageProps) {
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const { code } = await props.params;
        if (cancelled) return;

        setCode(code);
        setLoading(true);
        setError(null);
        setNotFound(false);

        const res = await fetch(`/api/links/${code}`);
        if (res.status === 404) {
          setNotFound(true);
          setStats(null);
          return;
        }

        if (!res.ok) {
          setError('Failed to load stats. Please try again.');
          return;
        }

        const data: LinkStats = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Something went wrong. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [props.params]);

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';

  const shortUrl = code ? `${baseUrl}/${code}` : '';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Link stats
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Detailed stats for a single short code.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-300"
          >
            ← Back to dashboard
          </Link>
        </header>

        {loading && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            Loading stats…
          </div>
        )}

        {!loading && notFound && (
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Short code not found. It may have been deleted or never existed.
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && !notFound && stats && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-100">
                Short link
              </h2>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-200">
                    Short code:
                  </span>
                  <span className="rounded-md bg-slate-950/80 px-2 py-1 font-mono text-[11px] text-sky-300">
                    {stats.code}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-200">
                    Short URL:
                  </span>
                  <span className="rounded-md bg-slate-950/80 px-2 py-1 font-mono text-[11px] text-slate-200">
                    {shortUrl}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shortUrl);
                        alert('Short URL copied to clipboard.');
                      } catch (err) {
                        console.error(err);
                        alert('Failed to copy. Please copy manually.');
                      }
                    }}
                    className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-300"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-200">
                    Target URL:
                  </span>
                  <a
                    href={stats.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sky-400 hover:underline"
                  >
                    {stats.targetUrl}
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-[11px] uppercase text-slate-400">
                  Total clicks
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">
                  {stats.totalClicks}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-[11px] uppercase text-slate-400">
                  Last clicked
                </div>
                <div className="mt-2 text-xs text-slate-200">
                  {stats.lastClickedAt
                    ? new Date(stats.lastClickedAt).toLocaleString()
                    : 'Never'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-[11px] uppercase text-slate-400">
                  Created at
                </div>
                <div className="mt-2 text-xs text-slate-200">
                  {new Date(stats.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
