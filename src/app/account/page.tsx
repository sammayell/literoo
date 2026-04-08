"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, isActiveSubscriber } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { ageToTier } from "@/lib/subscription";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  age_tier: string;
}

export default function AccountPage() {
  const { user, loading, parentProfile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [childError, setChildError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const fetchChildren = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("child_profiles")
      .select("id, name, age, age_tier")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setChildren(data);
    setLoadingChildren(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) fetchChildren();
  }, [user, fetchChildren]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-brand-500 font-[family-name:var(--font-lexend)] text-lg">Loading...</div>
      </div>
    );
  }

  const isActive = isActiveSubscriber(parentProfile);
  const isCanceled = parentProfile?.subscription_status === "canceled";

  const statusLabel = isActive ? "Active" : isCanceled ? "Canceled" : "Free";
  const statusColor = isActive
    ? "bg-green-100 text-green-700"
    : isCanceled
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-600";

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setChildError(null);

    const age = parseInt(childAge, 10);
    if (isNaN(age) || age < 0 || age > 17) {
      setChildError("Please enter a valid age (0-17).");
      return;
    }
    if (!childName.trim()) {
      setChildError("Please enter a name.");
      return;
    }
    if (children.length >= 5) {
      setChildError("Maximum of 5 child profiles allowed.");
      return;
    }

    setAddingChild(true);
    const { error } = await supabase.from("child_profiles").insert({
      parent_id: user.id,
      name: childName.trim(),
      age,
      age_tier: ageToTier(age),
    });

    if (error) {
      setChildError(error.message);
    } else {
      setChildName("");
      setChildAge("");
      await fetchChildren();
    }
    setAddingChild(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-[family-name:var(--font-lexend)]">
            My Account
          </h1>
          <Link
            href="/library"
            className="text-brand-500 hover:text-brand-600 font-semibold text-sm font-[family-name:var(--font-lexend)]"
          >
            Back to Library
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-lexend)] mb-4">
            Profile
          </h2>
          <div className="space-y-3 font-[family-name:var(--font-literata)]">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-900 font-medium">{parentProfile?.full_name || "Not set"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900 font-medium">{parentProfile?.email || user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Subscription</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Subscription actions */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            {isActive ? (
              <a
                href="/api/stripe/portal"
                className="inline-block px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm font-[family-name:var(--font-lexend)]"
              >
                Manage Subscription
              </a>
            ) : (
              <Link
                href="/pricing"
                className="inline-block px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition text-sm font-[family-name:var(--font-lexend)]"
              >
                Upgrade to Premium — $99/yr
              </Link>
            )}
          </div>
        </div>

        {/* Child Profiles */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-lexend)] mb-4">
            Child Profiles
          </h2>

          {loadingChildren ? (
            <p className="text-gray-400 text-sm font-[family-name:var(--font-literata)]">Loading...</p>
          ) : children.length === 0 ? (
            <p className="text-gray-400 text-sm font-[family-name:var(--font-literata)] mb-4">
              No child profiles yet. Add one below.
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-xl"
                >
                  <div>
                    <span className="font-semibold text-gray-900 font-[family-name:var(--font-lexend)]">
                      {child.name}
                    </span>
                    <span className="text-gray-500 text-sm font-[family-name:var(--font-literata)] ml-2">
                      Age {child.age}
                    </span>
                  </div>
                  <span className="text-xs bg-white text-brand-500 px-2 py-1 rounded-lg font-medium font-[family-name:var(--font-lexend)] capitalize">
                    {child.age_tier.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {children.length < 5 && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 font-[family-name:var(--font-lexend)] mb-3">
                Add a child
              </h3>

              {childError && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-[family-name:var(--font-literata)]">
                  {childError}
                </div>
              )}

              <form onSubmit={handleAddChild} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label htmlFor="childName" className="block text-xs text-gray-500 font-[family-name:var(--font-literata)] mb-1">
                    Name
                  </label>
                  <input
                    id="childName"
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-gray-900 text-sm font-[family-name:var(--font-literata)]"
                    placeholder="Child's name"
                  />
                </div>
                <div className="w-20">
                  <label htmlFor="childAge" className="block text-xs text-gray-500 font-[family-name:var(--font-literata)] mb-1">
                    Age
                  </label>
                  <input
                    id="childAge"
                    type="number"
                    required
                    min={0}
                    max={17}
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-gray-900 text-sm font-[family-name:var(--font-literata)]"
                    placeholder="5"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingChild}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition disabled:opacity-50 text-sm font-[family-name:var(--font-lexend)] whitespace-nowrap"
                >
                  {addingChild ? "Adding..." : "Add Child"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Sign Out */}
        <div className="text-center">
          <button
            onClick={handleSignOut}
            className="px-6 py-3 text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold rounded-xl transition font-[family-name:var(--font-lexend)]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
