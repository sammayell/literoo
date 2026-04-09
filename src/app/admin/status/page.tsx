"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { useAuth } from "@/lib/auth-context";

const ADMIN_EMAILS = ["sam@sammayell.com", "hello@chillplayvibe.com"];

interface PipelineStatus {
  books: { total: number; byTier: Record<string, number> };
  illustrations: { total: number; pending: number; review: number; approved: number; complete: number };
  api: { anthropic: string; gemini: string };
}

const TIER_TARGETS: Record<string, number> = {
  baby: 150, toddler: 200, early_reader: 200,
  reader: 200, middle_grade: 150, young_adult: 100,
};

const TIER_LABELS: Record<string, string> = {
  baby: "Baby (1-2)", toddler: "Toddler (2-4)", early_reader: "Early Reader (4-6)",
  reader: "Reader (6-9)", middle_grade: "Middle Grade (9-12)", young_adult: "Young Adult (12-18)",
};

export default function AdminStatusPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) loadStatus();
  }, [isAdmin]);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/status");
      const data = await res.json();
      setStatus(data);
    } catch {}
    setLoading(false);
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-stone-400">Loading...</div></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Admin access required.</p>
          <a href="/auth/login" className="text-brand-500 hover:underline">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              Pipeline Dashboard
            </h1>
            <p className="text-sm text-stone-500 mt-1">API status, book generation progress, and quick links</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="text-sm bg-stone-200 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-300">
              Illustration Admin
            </Link>
          </div>
        </div>

        {/* Quick Action Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <a
            href="https://console.anthropic.com/settings/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-stone-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all text-center group"
          >
            <div className="text-2xl mb-2">💳</div>
            <p className="text-sm font-semibold text-stone-900 group-hover:text-brand-600">Anthropic Billing</p>
            <p className="text-xs text-stone-500">Top up API credits</p>
          </a>
          <a
            href="https://console.cloud.google.com/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-stone-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all text-center group"
          >
            <div className="text-2xl mb-2">🎨</div>
            <p className="text-sm font-semibold text-stone-900 group-hover:text-brand-600">Google Cloud Billing</p>
            <p className="text-xs text-stone-500">Gemini API credits</p>
          </a>
          <a
            href="https://supabase.com/dashboard/project/mjaklmkvxdlizufgpssf"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-stone-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all text-center group"
          >
            <div className="text-2xl mb-2">🗄️</div>
            <p className="text-sm font-semibold text-stone-900 group-hover:text-brand-600">Supabase</p>
            <p className="text-xs text-stone-500">Database & storage</p>
          </a>
          <a
            href="https://vercel.com/sam-mayells-projects/literoo"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-stone-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all text-center group"
          >
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-sm font-semibold text-stone-900 group-hover:text-brand-600">Vercel</p>
            <p className="text-xs text-stone-500">Deployments</p>
          </a>
        </div>

        {/* API Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone-900">Anthropic API</h3>
              {status?.api.anthropic === "active" ? (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
              ) : (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold">No Credits</span>
              )}
            </div>
            <p className="text-sm text-stone-500 mb-3">Book text generation (Claude Sonnet)</p>
            <div className="text-xs text-stone-400 space-y-1">
              <p>Model: claude-sonnet-4-20250514</p>
              <p>Batch API: 50% discount on tokens</p>
              <p>Est. cost: ~$0.10/book (baby) to ~$2/book (YA)</p>
            </div>
            <a
              href="https://console.anthropic.com/settings/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block bg-brand-500 text-white text-xs px-4 py-2 rounded-lg hover:bg-brand-600 font-semibold"
            >
              Top Up Credits →
            </a>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone-900">Gemini API</h3>
              {status?.api.gemini === "active" ? (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
              ) : (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-semibold">Unknown</span>
              )}
            </div>
            <p className="text-sm text-stone-500 mb-3">Illustration generation (Gemini Flash)</p>
            <div className="text-xs text-stone-400 space-y-1">
              <p>Model: gemini-2.5-flash-image</p>
              <p>Cost: ~$0.039/image</p>
              <p>Est. cost: ~$0.50/book (refs) + ~$0.50/book (scenes)</p>
            </div>
            <a
              href="https://console.cloud.google.com/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block bg-blue-500 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold"
            >
              Check Balance →
            </a>
          </div>
        </div>

        {/* Book Generation Progress */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-stone-900 mb-4">Book Generation Progress</h3>

          {loading ? (
            <div className="text-center py-8 text-stone-400">Loading...</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(TIER_TARGETS).map(([tier, target]) => {
                const current = status?.books.byTier[tier] || 0;
                const pct = Math.min(100, Math.round((current / target) * 100));
                const isFull = current >= target;

                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-stone-700 font-medium">{TIER_LABELS[tier]}</span>
                      <span className={`text-xs font-semibold ${isFull ? "text-green-600" : "text-stone-500"}`}>
                        {current} / {target} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? "bg-green-500" : "bg-brand-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 border-t border-stone-100 flex justify-between text-sm">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="font-semibold text-stone-900">{status?.books.total || 0} / 1,000</span>
              </div>
            </div>
          )}
        </div>

        {/* Illustration Pipeline */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Illustration Pipeline</h3>
            <Link href="/admin" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
              Open Admin →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total", value: status?.illustrations.total || 0, color: "bg-stone-100" },
              { label: "Pending", value: status?.illustrations.pending || 0, color: "bg-yellow-100" },
              { label: "In Review", value: status?.illustrations.review || 0, color: "bg-blue-100" },
              { label: "Approved", value: status?.illustrations.approved || 0, color: "bg-green-100" },
              { label: "Complete", value: status?.illustrations.complete || 0, color: "bg-purple-100" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-lg p-3 text-center`}>
                <div className="text-xl font-bold text-stone-900">{s.value}</div>
                <div className="text-xs text-stone-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Estimates */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-semibold text-stone-900 mb-4">Cost Estimates</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-100">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-right">Unit Cost</th>
                  <th className="pb-2 font-medium text-right">Quantity</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-stone-700">
                <tr className="border-b border-stone-50">
                  <td className="py-2">Book text (baby-reader)</td>
                  <td className="py-2 text-right">~$0.15</td>
                  <td className="py-2 text-right">750</td>
                  <td className="py-2 text-right">~$112</td>
                </tr>
                <tr className="border-b border-stone-50">
                  <td className="py-2">Book text (MG + YA)</td>
                  <td className="py-2 text-right">~$1.50</td>
                  <td className="py-2 text-right">250</td>
                  <td className="py-2 text-right">~$375</td>
                </tr>
                <tr className="border-b border-stone-50">
                  <td className="py-2">Character + style refs</td>
                  <td className="py-2 text-right">$0.08</td>
                  <td className="py-2 text-right">1,000</td>
                  <td className="py-2 text-right">~$80</td>
                </tr>
                <tr className="border-b border-stone-50">
                  <td className="py-2">Scene illustrations</td>
                  <td className="py-2 text-right">~$0.50</td>
                  <td className="py-2 text-right">1,000</td>
                  <td className="py-2 text-right">~$500</td>
                </tr>
                <tr className="border-b border-stone-50">
                  <td className="py-2">Quality review (AI)</td>
                  <td className="py-2 text-right">$0.02</td>
                  <td className="py-2 text-right">1,000</td>
                  <td className="py-2 text-right">~$20</td>
                </tr>
                <tr className="font-bold">
                  <td className="pt-3">Total (1,000 books)</td>
                  <td className="pt-3"></td>
                  <td className="pt-3"></td>
                  <td className="pt-3 text-right">~$1,087</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
