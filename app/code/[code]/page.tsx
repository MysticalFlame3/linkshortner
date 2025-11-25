'use client';

import { useEffect, useState } from 'react';

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

  function handleBackToDashboard() {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen w-full flex-col px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top bar */}
        <header className="mb-4 sm:mb-5 lg:mb-6 flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-white/90 px-4 sm:px-6 py-4 sm:py-5 shadow-md backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-slate-900 text-base sm:text-lg font-semibold text-white shadow-sm flex-shrink-0">
                TL
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold tracking-tight">
                  Link Stats
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Detailed metrics for your short link.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="self-start sm:self-auto rounded-full border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-800 shadow-sm hover:border-slate-900 whitespace-nowrap"
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>

        {loading && (
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-xs sm:text-sm text-slate-600 shadow-md">
            Loading stats…
          </div>
        )}

        {!loading && notFound && (
          <div className="rounded-xl sm:rounded-2xl border border-yellow-200 bg-yellow-50 p-4 sm:p-5 text-xs sm:text-sm text-yellow-800 shadow-md">
            Short code not found. It may have been deleted or never existed.
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 text-xs sm:text-sm text-red-700 shadow-md">
            {error}
          </div>
        )}

        {!loading && !error && !notFound && stats && (
          <section className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Main link details */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-md">
              <h2 className="mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-semibold text-slate-900">
                Short link details
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-800">
                    Short code:
                  </span>
                  <span className="rounded-md bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-800 inline-block">
                    {stats.code}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-800">
                    Short URL:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-800 break-all">
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
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start gap-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-800 whitespace-nowrap">
                    Target URL:
                  </span>
                  <a
                    href={stats.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-xs sm:text-sm text-slate-900 underline-offset-2 hover:underline"
                  >
                    {stats.targetUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total clicks
                </div>
                <div className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
                  {stats.totalClicks}
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Last clicked
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-800">
                  {stats.lastClickedAt
                    ? new Date(stats.lastClickedAt).toLocaleString()
                    : 'Never'}
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created at
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-800">
                  {new Date(stats.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-300 bg-white px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-slate-800 shadow-xl max-w-[90vw]">
          {toast}
        </div>
      )}
    </main>
  );
}