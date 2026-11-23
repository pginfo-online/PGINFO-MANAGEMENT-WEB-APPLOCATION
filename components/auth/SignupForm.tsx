"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { authActions } from "@/lib/api/client";

export default function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!firstName.trim()) {
      setErrorMessage("First name is required.");
      return;
    }

    if (orgName.trim() && orgName.trim().length < 2) {
      setErrorMessage("Organization name must be at least 2 characters.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setErrorMessage("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one digit.");
      return;
    }

    if (mobile.trim() && !/^[6-9]\d{9}$/.test(mobile.trim())) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number (starting with 6-9).");
      return;
    }

    try {
      setIsLoading(true);
      await authActions.register({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        organizationName: orgName.trim() || undefined,
        email: email.trim().toLowerCase(),
        mobile: mobile.trim() || undefined,
        password,
      });

      window.dispatchEvent(new Event("pginfo-session"));
      router.replace("/");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Registration failed. Email or mobile might already be registered."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-1 py-4 sm:p-8">
      {/* Brand & Title */}
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 shadow-xl shadow-blue-500/25 mb-4">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Create <span className="text-emerald-800">PgInfo</span> Account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Start managing your properties, beds, dues, and tenants with ease
        </p>
      </div>

      {/* Signup Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-8 shadow-2xl backdrop-blur-xl">
        {errorMessage && (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-sm text-rose-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="signup-first-name" className="block text-xs font-medium text-slate-700 mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                <input
                  type="text"
                  id="signup-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rahul"
                  autoComplete="given-name"
                  maxLength={100}
                  required
                  className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
              </div>
            </div>
            <div>
              <label htmlFor="signup-last-name" className="block text-xs font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="signup-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Verma"
                autoComplete="family-name"
                maxLength={100}
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-organization" className="block text-xs font-medium text-slate-700 mb-1">
              Organization / PG Brand Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
              <input
                type="text"
                id="signup-organization"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Skyline Living PG"
                autoComplete="organization"
                maxLength={100}
                className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Leave blank to use a default workspace name.
            </p>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-medium text-slate-700 mb-1">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                required
                autoComplete="email"
                maxLength={254}
                className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-mobile" className="block text-xs font-medium text-slate-700 mb-1">
              Mobile Number (10 digits)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
              <input
                type="tel"
                id="signup-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={10}
                className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-medium text-slate-700 mb-1">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
              <input
                type={showPassword ? "text" : "password"}
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars, 1 uppercase & 1 number"
                required
                autoComplete="new-password"
                maxLength={100}
                className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 transition"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600">
              <ShieldCheck className="h-3 w-3 text-indigo-400" />
              <span>Must contain uppercase, lowercase, and a number</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || Boolean(successMessage)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating your account...
              </span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-800 hover:text-emerald-900 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
