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

  // toast state
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  }

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
    <main className="min-h-screen bg-slate-100 text-slate-900 text-[15px] sm:text-[16px]">
      {/* full-width container on mobile, like dashboard */}
      <div className="flex min-h-screen w-full flex-col px-3 sm:px-4 py-5 sm:py-8 lg:py-10">
        {/* Top bar */}
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 shadow-md backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white shadow-sm">
              TL
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Link Stats
              </h1>
              <p className="text-sm text-slate-500">
                Detailed metrics for your short link.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:border-slate-900"
          >
            ← Back to dashboard
          </Link>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-md">
            Loading stats…
          </div>
        )}

        {!loading && notFound && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-800 shadow-md">
            Short code not found. It may have been deleted or never existed.
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-md">
            {error}
          </div>
        )}

        {!loading && !error && !notFound && stats && (
          <section className="space-y-6">
            {/* Main link details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-md">
              <h2 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900">
                Short link details
              </h2>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-800">
                    Short code:
                  </span>
                  <span className="rounded-md bg-slate-50 px-3 py-1 font-mono text-xs text-slate-800">
                    {stats.code}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-800">
                    Short URL:
                  </span>
                  <span className="rounded-md bg-slate-50 px-3 py-1 font-mono text-xs text-slate-800">
                    {shortUrl}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shortUrl);
                        showToast('Short URL copied to clipboard');
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900"
                  >
                    Copy
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-800">
                    Target URL:
                  </span>
                  <a
                    href={stats.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm text-slate-900 underline-offset-2 hover:underline"
                  >
                    {stats.targetUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Total clicks
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.totalClicks}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Last clicked
                </div>
                <div className="mt-2 text-sm text-slate-800">
                  {stats.lastClickedAt
                    ? new Date(stats.lastClickedAt).toLocaleString()
                    : 'Never'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Created at
                </div>
                <div className="mt-2 text-sm text-slate-800">
                  {new Date(stats.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-800 shadow-xl">
          {toast}
        </div>
      )}
    </main>
  );
}
