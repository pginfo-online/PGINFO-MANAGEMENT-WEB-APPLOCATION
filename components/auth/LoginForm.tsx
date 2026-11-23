"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { authActions } from "@/lib/api/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      await authActions.login({ email: email.trim(), password });
      window.dispatchEvent(new Event("pginfo-session"));
      const next = new URLSearchParams(window.location.search).get("next");
      const target = next?.startsWith("/") && URL.canParse(next, window.location.origin) ? new URL(next, window.location.origin) : null;
      const destination = target?.origin === window.location.origin && !["/login", "/signup"].includes(target.pathname)
        ? target.pathname + target.search + target.hash
        : "/";
      router.replace(destination);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8">
      {/* Brand & Title */}
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 shadow-xl shadow-blue-500/25 mb-4">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Welcome to <span className="text-emerald-800">PgInfo</span>
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to manage your PGs, hostels, flats, and residents
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {errorMessage && (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                id="login-email"
                autoComplete="username"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                id="login-password"
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 transition"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-600">
            Don't have an account yet?{" "}
            <Link
              href="/signup"
              className="font-medium text-emerald-800 hover:text-emerald-900 transition"
            >
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
