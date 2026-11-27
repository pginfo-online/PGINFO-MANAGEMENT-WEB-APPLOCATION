"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { ApiError, api, authActions } from "@/lib/api/client";
import OtpCodeInput from "./OtpCodeInput";

type AuthMethod = "otp" | "password";

export default function LoginForm() {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>("password");

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mobile OTP state
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "verify">("phone");
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

  const navigateAfterLogin = () => {
    window.dispatchEvent(new Event("pginfo-session"));
    const next = new URLSearchParams(window.location.search).get("next");
    const target =
      next?.startsWith("/") && URL.canParse(next, window.location.origin)
        ? new URL(next, window.location.origin)
        : null;
    const destination =
      target?.origin === window.location.origin &&
      !["/login", "/signup"].includes(target.pathname)
        ? target.pathname + target.search + target.hash
        : "/";
    router.replace(destination);
  };

  const handleMethodChange = (nextMethod: AuthMethod) => {
    if (isLoading) return;
    setMethod(nextMethod);
    setErrorMessage("");
    setInfoMessage("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const identifier = loginId.trim();
    if (!identifier || !password) {
      setErrorMessage("Enter your email or mobile number and password.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setInfoMessage("");
      const account = identifier.includes("@") ? { email: identifier } : { mobile: identifier };
      await authActions.login({ ...account, password });
      navigateAfterLogin();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Sign-in failed. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const cleanMobile = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setInfoMessage("");
      const res = await api.auth.sendOtp({
        mobile: cleanMobile,
        purpose: "LOGIN",
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
        error instanceof Error ? error.message : "Could not send verification code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isLoading || resendSeconds > 0) return;
    try {
      setIsLoading(true);
      setErrorMessage("");
      const res = await api.auth.resendOtp({
        mobile,
        purpose: "LOGIN",
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!/^\d{4}$/.test(otp)) {
      setErrorMessage("Please enter the 4-digit OTP sent to your mobile.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      await authActions.loginWithOtp({ mobile, otp });
      navigateAfterLogin();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "OTP verification failed. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 py-6 sm:p-8">
      {/* Brand & Title */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 shadow-xl shadow-emerald-900/20 mb-4">
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
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-8 shadow-xl">
        {/* Auth Mode Switcher */}
        <div
          role="tablist"
          aria-label="Sign-in method"
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
            Password
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-800"
          >
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{errorMessage}</span>
              {method === "otp" && errorMessage.toLowerCase().includes("not found") && (
                <p>
                  <Link href="/signup" className="font-semibold underline text-emerald-800">
                    Create a new account with OTP
                  </Link>
                </p>
              )}
            </div>
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
          otpStep === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="login-mobile"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Registered Mobile Number
                </label>
                <div className="flex rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-emerald-700 focus-within:border-transparent overflow-hidden transition">
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 px-3 text-xs font-semibold text-slate-600 border-r border-slate-200">
                    <Phone className="h-3.5 w-3.5" />
                    +91
                  </span>
                  <input
                    id="login-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="9876543210"
                    required
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  We&apos;ll send a 4-digit verification code valid for 5 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 border border-slate-200">
                <span>
                  Code sent to <strong className="text-slate-900">+91 {maskedMobile || mobile}</strong>
                </span>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setOtpStep("phone");
                    setOtp("");
                    setErrorMessage("");
                    setInfoMessage("");
                  }}
                  className="font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  Change
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
                    Verifying...
                  </span>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
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
                    onClick={handleResendOtp}
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
            <div>
              <label
                htmlFor="login-id"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email or mobile number
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="login-id"
                  autoComplete="username"
                  type="text"
                  autoCapitalize="none"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="login-password"
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition"
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
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
        )}

        <div className="mt-6 pt-5 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-emerald-800 hover:text-emerald-900 transition"
            >
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
