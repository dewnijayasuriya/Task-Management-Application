"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const linkClass = (href) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-brand-50 text-brand-700"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href={user ? "/dashboard" : "/"}
              className="flex items-center gap-2"
            >
              <span className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="4" width="14" height="17" rx="2" />
                  <path d="M9 4.5V3h6v1.5M8.5 12l2 2 5-5" />
                </svg>
              </span>
              <span className="font-semibold text-lg text-slate-900">
                TaskBoard
              </span>
            </Link>

            {user && (
              <div className="hidden sm:flex items-center gap-1">
                <Link href="/dashboard" className={linkClass("/dashboard")}>
                  Dashboard
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/users"
                    className={linkClass("/admin/users")}
                  >
                    User Management
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-slate-900">
                      {user.name}
                    </span>
                    <span className="text-sm text-slate-400">
                      {user.role === "ADMIN" ? "Administrator" : "Member"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  type="button"
                  aria-label="Log out"
                  title="Log out"
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg
                    aria-hidden="true"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
