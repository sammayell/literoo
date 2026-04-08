"use client";

import Link from "next/link";
import { useAuth, isActiveSubscriber } from "@/lib/auth-context";

interface HeaderProps {
  currentPage?: string; // highlight current page in nav
}

export function Header({ currentPage }: HeaderProps) {
  const { user, loading, parentProfile, signOut } = useAuth();
  const subscribed = isActiveSubscriber(parentProfile);

  return (
    <header className="bg-white/95 backdrop-blur border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-lg font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              Literoo
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 sm:gap-3">
            <NavLink href="/library" current={currentPage === "library"}>
              Library
            </NavLink>
            <NavLink href="/dashboard" current={currentPage === "dashboard"} className="hidden sm:block">
              Dashboard
            </NavLink>
            <NavLink href="/info" current={currentPage === "info"} className="hidden sm:block">
              For Parents
            </NavLink>

            {/* Auth section */}
            {loading ? (
              <div className="w-20 h-8 bg-stone-100 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 ml-2">
                {!subscribed && (
                  <Link
                    href="/pricing"
                    className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
                  >
                    Upgrade
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-stone-100"
                >
                  <div className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {parentProfile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {parentProfile?.full_name?.split(" ")[0] || "Account"}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-stone-600 hover:text-stone-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  current,
  children,
  className = "",
}: {
  href: string;
  current?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
        current
          ? "text-brand-600 font-semibold bg-brand-50"
          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
