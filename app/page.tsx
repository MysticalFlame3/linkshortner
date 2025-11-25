'use client';

import { useEffect, useState, FormEvent, useMemo } from 'react';
import Link from 'next/link';

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

  async function handleCreateLink(e: FormEvent) {
    e.preventDefault();
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

  // open confirmation modal instead of window.confirm
  async function handleDelete(code: string) {
    setPendingDeleteCode(code);
  }

  // actual delete after confirm
  async function confirmDelete() {
    if (!pendingDeleteCode) return;

    const code = pendingDeleteCode;
    setPendingDeleteCode(null);

    try {
      const previous = links;
      // optimistic remove
      setLinks((p) => p.filter((l) => l.code !== code));

      const res = await fetch(`/api/links/${code}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        // rollback on failure
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
    <main className="min-h-screen bg-slate-100 text-slate-900 text-[15px] sm:text-[16px]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:py-8 lg:py-10">
        {/* Top bar */}
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-6 py-5 shadow-md backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white shadow-sm">
              TL
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                TinyLink Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Create, manage and monitor your short links.
              </p>
            </div>
          </div>
        </header>

        {/* Overview cards */}
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total links
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {links.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total clicks
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {totalClicks}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p className="mt-2 text-base text-slate-700 leading-relaxed">
              Links are stored in Postgres and redirects are tracked on every
              hit.
            </p>
          </div>
        </section>

        {/* Main area: form + table */}
        <div className="grid flex-1 gap-5 lg:grid-cols-[340px,minmax(0,1fr)]">
          {/* Create link card */}
          <section className="h-max rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              Create short link
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Paste a long URL and optionally define a custom short code
              (6–8 characters).
            </p>

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Target URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/very/long/path"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Custom short code (optional)
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="rounded-md bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-500">
                    yourdomain.com/
                  </span>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="abc123"
                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/40"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {formSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formLoading ? 'Creating…' : 'Create short link'}
              </button>
            </form>
          </section>

          {/* Links table card */}
          <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-md sm:p-5">
            {loading && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading links…
              </div>
            )}

            {error && !loading && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && links.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No links yet. Use the form on the left to create your first
                short link.
              </div>
            )}

            {!loading && !error && links.length > 0 && (
              <>
                {/* Search bar */}
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">
                    All links
                  </h2>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by short code or URL…"
                    className="w-full max-w-xs rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/40"
                  />
                </div>

                <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                        <th className="px-4 py-3">Short code</th>
                        <th className="px-4 py-3">Target URL</th>
                        <th className="px-4 py-3">Clicks</th>
                        <th className="px-4 py-3">Last clicked</th>
                        <th className="px-4 py-3">Actions</th>
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
                            {/* SHORT CODE – NOW COMPLETELY NORMAL (NOT BOLD, NOT MONO) */}
                            <td className="px-4 py-3 text-base font-normal text-slate-900">
                              <Link
                                href={`/code/${link.code}`}
                                className="underline-offset-2 hover:underline font-normal"
                              >
                                {link.code}
                              </Link>
                            </td>
                            <td className="max-w-xs px-4 py-3">
                              <div className="truncate text-sm text-slate-700">
                                {link.targetUrl}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              {link.totalClicks}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {link.lastClickedAt
                                ? new Date(
                                    link.lastClickedAt,
                                  ).toLocaleString()
                                : 'Never'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              <span className="inline-flex flex-wrap gap-2">
                                <Link
                                  href={`/code/${link.code}`}
                                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900"
                                >
                                  Stats
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(link.code)}
                                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900"
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(link.code)}
                                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 shadow-sm hover:border-red-400"
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

      {/* Delete confirmation overlay (replaces window.confirm) */}
      {pendingDeleteCode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="mb-4 text-sm text-slate-800">
              Are you sure you want to delete short code{' '}
              <span className="font-mono font-semibold">
                {pendingDeleteCode}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3 text-sm">
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-800 shadow-xl">
          {toast}
        </div>
      )}
    </main>
  );
}
