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

  function isValidUrl(url: string) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

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
    const confirmDelete = window.confirm(
      `Are you sure you want to delete short code "${code}"?`,
    );
    if (!confirmDelete) return;

    try {
      const prev = links;
      setLinks((p) => p.filter((l) => l.code !== code));

      const res = await fetch(`/api/links/${code}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setLinks(prev);
        console.error('Failed to delete link');
        alert('Failed to delete link. Please refresh and try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting link. Please refresh and try again.');
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
      alert('Short URL copied to clipboard: ' + fullUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to copy. You can copy manually from the table.');
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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            TinyLink Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Create and manage short links with basic click stats.
          </p>
        </header>

        {/* Create Link Form */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">
            Create a new short link
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Enter a long URL and optionally a custom short code. Codes must be
            6–8 characters using only A–Z, a–z, 0–9.
          </p>

          <form onSubmit={handleCreateLink} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                Target URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/very/long/path"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                Custom short code (optional)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="rounded-md bg-slate-950/80 px-2 py-1 font-mono text-[11px] text-slate-400">
                  yourdomain.com/
                </span>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="abc123"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex items-center rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formLoading ? 'Creating…' : 'Create short link'}
            </button>
          </form>
        </section>

        {/* List / table section */}
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
            No links yet. Use the form above to create your first short link.
          </div>
        )}

        {!loading && !error && links.length > 0 && (
          <section className="mt-2 space-y-3">
            {/* Search / filter bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                All links
              </h2>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by short code or URL…"
                className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
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
                  {filteredLinks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-4 text-center text-xs text-slate-400"
                      >
                        No links match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLinks.map((link) => (
                      <tr
                        key={link.code}
                        className="border-t border-slate-800/80 hover:bg-slate-900/80"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-sky-300">
                          <Link
                            href={`/code/${link.code}`}
                            className="hover:underline hover:text-sky-200"
                          >
                            {link.code}
                          </Link>
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
                          <span className="inline-flex gap-2">
                            <Link
                              href={`/code/${link.code}`}
                              className="rounded-md border border-slate-700/70 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-300"
                            >
                              Stats
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleCopy(link.code)}
                              className="rounded-md border border-slate-700/70 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-300"
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(link.code)}
                              className="rounded-md border border-red-500/40 px-2 py-1 text-[11px] text-red-200/90 hover:border-red-500 hover:text-red-300"
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
          </section>
        )}
      </div>
    </main>
  );
}
