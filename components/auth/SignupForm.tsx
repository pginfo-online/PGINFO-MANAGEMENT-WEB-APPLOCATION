"use client";

import React, { useEffect, useState } from "react";
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
  RotateCcw,
} from "lucide-react";
import { ApiError, api, authActions } from "@/lib/api/client";
import OtpCodeInput from "./OtpCodeInput";

type SignupMethod = "otp" | "password";

export default function SignupForm() {
  const router = useRouter();
  const [method, setMethod] = useState<SignupMethod>("otp");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"details" | "verify">("details");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(300);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const handleMethodChange = (nextMethod: SignupMethod) => {
    if (isLoading) return;
    setMethod(nextMethod);
    setErrorMessage("");
    setInfoMessage("");
  };

  const validateCommonDetails = (requireEmail: boolean): boolean => {
    if (!firstName.trim()) {
      setErrorMessage("First name is required.");
      return false;
    }
    if (orgName.trim() && orgName.trim().length < 2) {
      setErrorMessage("Organization name must be at least 2 characters.");
      return false;
    }
    if (requireEmail || email.trim()) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMessage("Please enter a valid email address.");
        return false;
      }
    }
    return true;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!validateCommonDetails(true)) return;

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
      setErrorMessage(
        "Please enter a valid 10-digit Indian mobile number (starting with 6-9).",
      );
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
          : "Registration failed. Email or mobile might already be registered.",
      );
      setIsLoading(false);
    }
  };

  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage("");
    setInfoMessage("");

    if (!validateCommonDetails(false)) return;

    const cleanMobile = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setErrorMessage(
        "Please enter a valid 10-digit Indian mobile number (starting with 6-9).",
      );
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.auth.sendOtp({
        mobile: cleanMobile,
        purpose: "REGISTER",
        email: email.trim() ? email.trim().toLowerCase() : undefined,
      });
      setMobile(res.mobile);
      setMaskedMobile(res.maskedMobile);
      setResendSeconds(res.resendAfterSeconds);
      setExpirySeconds(res.expiresInSeconds);
      setOtp("");
      setOtpStep("verify");
      setInfoMessage(res.message);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429 && error.data?.retryAfterSeconds) {
        setResendSeconds(Number(error.data.retryAfterSeconds));
      }
      setErrorMessage(
        error instanceof Error ? error.message : "Could not send verification OTP.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (isLoading || resendSeconds > 0) return;
    try {
      setIsLoading(true);
      setErrorMessage("");
      const res = await api.auth.resendOtp({
        mobile,
        purpose: "REGISTER",
      });
      setResendSeconds(res.resendAfterSeconds);
      setExpirySeconds(res.expiresInSeconds);
      setOtp("");
      setInfoMessage("A new 4-digit OTP has been sent to your mobile.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 429 && error.data?.retryAfterSeconds) {
        setResendSeconds(Number(error.data.retryAfterSeconds));
      }
      setErrorMessage(
        error instanceof Error ? error.message : "Could not resend OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!/^\d{4}$/.test(otp)) {
      setErrorMessage("Please enter the 4-digit OTP sent to your mobile.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      await authActions.registerWithOtp({
        mobile,
        otp,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        organizationName: orgName.trim() || undefined,
        email: email.trim() ? email.trim().toLowerCase() : undefined,
      });
      window.dispatchEvent(new Event("pginfo-session"));
      router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "OTP verification failed. Please check the code and try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-3 py-5 sm:p-8">
      {/* Brand & Title */}
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 shadow-xl shadow-emerald-900/20 mb-4">
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
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-8 shadow-xl">
        {/* Registration Mode Switcher */}
        <div
          role="tablist"
          aria-label="Registration method"
          className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 mb-5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={method === "otp"}
            onClick={() => handleMethodChange("otp")}
            className={`rounded-lg py-2 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              method === "otp"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={method === "password"}
            onClick={() => handleMethodChange("password")}
            className={`rounded-lg py-2 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              method === "password"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Email & Password
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-800"
          >
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && !errorMessage && (
          <div
            role="status"
            className="mb-4 flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm text-emerald-900"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {method === "otp" ? (
          otpStep === "details" ? (
            <form onSubmit={handleSendSignupOtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="otp-first-name" className="block text-xs font-medium text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      id="otp-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Rahul"
                      autoComplete="given-name"
                      maxLength={100}
                      required
                      className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="otp-last-name" className="block text-xs font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="otp-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Verma"
                    autoComplete="family-name"
                    maxLength={100}
                    className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="otp-organization" className="block text-xs font-medium text-slate-700 mb-1">
                  Organization / PG Brand Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    id="otp-organization"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Skyline Living PG"
                    autoComplete="organization"
                    maxLength={100}
                    className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="otp-mobile" className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number (10 digits) <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-emerald-700 focus-within:border-transparent overflow-hidden transition">
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 px-3 text-xs font-semibold text-slate-600 border-r border-slate-200">
                    <Phone className="h-3.5 w-3.5" />
                    +91
                  </span>
                  <input
                    type="tel"
                    id="otp-mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="otp-email" className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="email"
                    id="otp-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    autoComplete="email"
                    maxLength={254}
                    className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  <>
                    <span>Send 4-Digit OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySignupOtp} className="space-y-5">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 border border-slate-200">
                <div>
                  <span className="block font-semibold text-slate-900">
                    {[firstName, lastName].filter(Boolean).join(" ")}
                  </span>
                  <span>OTP sent to +91 {maskedMobile || mobile}</span>
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setOtpStep("details");
                    setOtp("");
                    setErrorMessage("");
                    setInfoMessage("");
                  }}
                  className="font-semibold text-emerald-800 hover:underline cursor-pointer shrink-0"
                >
                  Edit details
                </button>
              </div>

              <div>
                <label className="block text-center text-xs font-medium text-slate-600 mb-3">
                  Enter 4-digit OTP (valid for {Math.round(expirySeconds / 60)} min)
                </label>
                <OtpCodeInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                  hasError={Boolean(errorMessage)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 4}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating your account...
                  </span>
                ) : (
                  <>
                    <span>Verify & Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center text-xs text-slate-600">
                {resendSeconds > 0 ? (
                  <span>Resend OTP in {resendSeconds}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleResendSignupOtp}
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 hover:text-emerald-900 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Resend 4-Digit OTP</span>
                  </button>
                )}
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-first-name" className="block text-xs font-medium text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    id="signup-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Rahul"
                    autoComplete="given-name"
                    maxLength={100}
                    required
                    className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
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
                  className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-organization" className="block text-xs font-medium text-slate-700 mb-1">
                Organization / PG Brand Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  id="signup-organization"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Skyline Living PG"
                  autoComplete="organization"
                  maxLength={100}
                  className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Leave blank to use a default workspace name.
              </p>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="email"
                  id="signup-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  required
                  autoComplete="email"
                  maxLength={254}
                  className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-mobile" className="block text-xs font-medium text-slate-700 mb-1">
                Mobile Number (10 digits)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="tel"
                  id="signup-mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-medium text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars, 1 uppercase & 1 number"
                  required
                  autoComplete="new-password"
                  maxLength={100}
                  className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>Must contain uppercase, lowercase, and a number</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-4"
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
        )}

        <div className="mt-5 pt-5 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-800 hover:text-emerald-900 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
