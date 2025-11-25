'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

type LinkType = {
  code: string;
  targetUrl: string;
  totalClicks: number;
  lastClickedAt: string | null;
  createdAt: string;
};

export default function HomePage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [targetUrl, setTargetUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // search/filter state
  const [search, setSearch] = useState('');

  // toast state
  const [toast, setToast] = useState<string | null>(null);

  // delete confirmation state
  const [pendingDeleteCode, setPendingDeleteCode] = useState<string | null>(
    null,
  );

  // refs for timers so we can clear on unmount / reset
  const formSuccessTimer = useRef<number | null>(null);
  const formErrorTimer = useRef<number | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  useEffect(() => {
    async function fetchLinks() {
      try {
        setLoading(true);
        const res = await fetch('/api/links');
        if (!res.ok) throw new Error('Failed to load links');
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

  // Auto-clear success messages after 3s
  useEffect(() => {
    if (formSuccess) {
      if (formSuccessTimer.current) {
        clearTimeout(formSuccessTimer.current);
      }
      formSuccessTimer.current = window.setTimeout(() => {
        setFormSuccess(null);
        formSuccessTimer.current = null;
      }, 3000);
    }
    return () => {
      if (formSuccessTimer.current) {
        clearTimeout(formSuccessTimer.current);
        formSuccessTimer.current = null;
      }
    };
  }, [formSuccess]);

  // Auto-clear error messages after 3s
  useEffect(() => {
    if (formError) {
      if (formErrorTimer.current) {
        clearTimeout(formErrorTimer.current);
      }
      formErrorTimer.current = window.setTimeout(() => {
        setFormError(null);
        formErrorTimer.current = null;
      }, 3000);
    }
    return () => {
      if (formErrorTimer.current) {
        clearTimeout(formErrorTimer.current);
        formErrorTimer.current = null;
      }
    };
  }, [formError]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (formSuccessTimer.current) {
        clearTimeout(formSuccessTimer.current);
        formSuccessTimer.current = null;
      }
      if (formErrorTimer.current) {
        clearTimeout(formErrorTimer.current);
        formErrorTimer.current = null;
      }
    };
  }, []);

  function isValidUrl(url: string) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const totalClicks = useMemo(
    () => links.reduce((sum, l) => sum + l.totalClicks, 0),
    [links],
  );

  async function handleCreateLink() {
    setFormError(null);
    setFormSuccess(null);

    if (!targetUrl.trim()) {
      setFormError('Target URL is required.');
      return;
    }

    if (!isValidUrl(targetUrl.trim())) {
      setFormError('Please enter a valid http or https URL.');
      return;
    }

    if (customCode && !/^[A-Za-z0-9]{6,8}$/.test(customCode)) {
      setFormError('Custom code must match [A-Za-z0-9]{6,8}.');
      return;
    }

    try {
      setFormLoading(true);

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          code: customCode.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        const body = await res.json();
        setFormError(body.error || 'This code is already taken.');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFormError(body?.error || 'Failed to create link.');
        return;
      }

      const newLink: LinkType = await res.json();

      setLinks((prev) => [newLink, ...prev]);
      setFormSuccess('Short link created successfully.');
      showToast('Short link created');
      setTargetUrl('');
      setCustomCode('');
    } catch (err) {
      console.error(err);
      setFormError('Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(code: string) {
    setPendingDeleteCode(code);
  }

  async function confirmDelete() {
    if (!pendingDeleteCode) return;

    const code = pendingDeleteCode;
    setPendingDeleteCode(null);

    try {
      const previous = links;
      setLinks((p) => p.filter((l) => l.code !== code));

      const res = await fetch(`/api/links/${code}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setLinks(previous);
        console.error('Failed to delete link');
      } else {
        showToast('Link deleted');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCopy(code: string) {
    try {
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost:3000';

      const fullUrl = `${baseUrl}/${code}`;
      await navigator.clipboard.writeText(fullUrl);
      showToast('Short URL copied to clipboard');
    } catch (err) {
      console.error(err);
    }
  }

  function handleStats(code: string) {
    // Navigate to stats page
    if (typeof window !== 'undefined') {
      window.location.href = `/code/${code}`;
    }
  }

  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.targetUrl.toLowerCase().includes(q),
    );
  }, [links, search]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full flex-col px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top bar */}
        <header className="mb-4 sm:mb-5 lg:mb-6 flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-white/90 px-4 sm:px-6 py-4 sm:py-5 shadow-md backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-slate-900 text-base sm:text-lg font-semibold text-white shadow-sm flex-shrink-0">
              TL
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold tracking-tight">
                TinyLink Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Create, manage and monitor your short links.
              </p>
            </div>
          </div>
        </header>

        {/* Overview cards */}
        <section className="mb-4 sm:mb-5 lg:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total links
            </p>
            <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
              {links.length}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total clicks
            </p>
            <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
              {totalClicks}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              Links are stored in Postgres and redirects are tracked on every hit.
            </p>
          </div>
        </section>

        {/* Main area: form + table */}
        <div className="grid flex-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(280px,340px),minmax(0,1fr)]">
          {/* Create link card */}
          <section className="h-max rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-md">
            <h2 className="mb-2 text-base sm:text-lg lg:text-xl font-semibold text-slate-900">
              Create short link
            </h2>
            <p className="mb-4 text-xs sm:text-sm text-slate-500">
              Paste a long URL and optionally define a custom short code (6–8 characters).
            </p>

            <div className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium text-slate-700">
                  Target URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateLink();
                    }
                  }}
                  placeholder="https://example.com/very/long/path"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 sm:py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium text-slate-700">
                  Custom short code (optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <span className="rounded-md bg-slate-50 px-2.5 sm:px-3 py-1.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                    yourdomain.com/
                  </span>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateLink();
                      }
                    }}
                    placeholder="abc123"
                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 sm:py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/40"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs sm:text-sm text-emerald-700">
                  {formSuccess}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateLink}
                disabled={formLoading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formLoading ? 'Creating…' : 'Create short link'}
              </button>
            </div>
          </section>

          {/* Links table card */}
          <section className="flex flex-col rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-5 shadow-md">
            {loading && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-600">
                Loading links…
              </div>
            )}

            {error && !loading && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && links.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6 text-xs sm:text-sm text-slate-600">
                No links yet. Use the form on the left to create your first short link.
              </div>
            )}

            {!loading && !error && links.length > 0 && (
              <>
                {/* Search bar */}
                <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-700">
                    All links
                  </h2>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by short code or URL…"
                    className="w-full sm:max-w-xs rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/40"
                  />
                </div>

                {/* Mobile card view */}
                <div className="block lg:hidden space-y-3">
                  {filteredLinks.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs sm:text-sm text-slate-500">
                      No links match your search.
                    </div>
                  ) : (
                    filteredLinks.map((link) => (
                      <div
                        key={link.code}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-slate-900 mb-1">
                              {link.code}
                            </div>
                            <div className="text-xs text-slate-600 break-all">
                              {link.targetUrl}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div>
                            <span className="text-slate-500">Clicks:</span>
                            <span className="ml-1 font-medium text-slate-800">
                              {link.totalClicks}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Last clicked:</span>
                            <div className="mt-0.5 text-slate-700">
                              {link.lastClickedAt
                                ? new Date(link.lastClickedAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Never'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleStats(link.code)}
                            className="flex-1 min-w-[70px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900"
                          >
                            Stats
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(link.code)}
                            className="flex-1 min-w-[70px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(link.code)}
                            className="flex-1 min-w-[70px] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm hover:border-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop table view */}
                <div className="hidden lg:block flex-1 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <th className="px-4 py-3 whitespace-nowrap">Short code</th>
                        <th className="px-4 py-3 whitespace-nowrap">Target URL</th>
                        <th className="px-4 py-3 whitespace-nowrap">Clicks</th>
                        <th className="px-4 py-3 whitespace-nowrap">Last clicked</th>
                        <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLinks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-5 text-center text-sm text-slate-500"
                          >
                            No links match your search.
                          </td>
                        </tr>
                      ) : (
                        filteredLinks.map((link) => (
                          <tr
                            key={link.code}
                            className="border-t border-slate-100 hover:bg-slate-50/60"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                              {link.code}
                            </td>
                            <td className="px-4 py-3 max-w-md">
                              <div className="truncate text-sm text-slate-700">
                                {link.targetUrl}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">
                              {link.totalClicks}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                              {link.lastClickedAt
                                ? new Date(link.lastClickedAt).toLocaleString()
                                : 'Never'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              <span className="inline-flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleStats(link.code)}
                                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900 whitespace-nowrap"
                                >
                                  Stats
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(link.code)}
                                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900 whitespace-nowrap"
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(link.code)}
                                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 shadow-sm hover:border-red-400 whitespace-nowrap"
                                >
                                  Delete
                                </button>
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {pendingDeleteCode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
            <p className="mb-4 text-xs sm:text-sm text-slate-800">
              Are you sure you want to delete short code{' '}
              {/* Prevent splitting on desktop: allow wrap on very small screens but keep single-line on sm+ */}
              <span className="font-mono font-semibold break-words sm:whitespace-nowrap">
                {pendingDeleteCode}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2 sm:gap-3 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setPendingDeleteCode(null)}
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-slate-700 hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-red-600 px-4 py-1.5 font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-300 bg-white px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-slate-800 shadow-xl max-w-[90vw]">
          {toast}
        </div>
      )}
    </main>
  );
}
