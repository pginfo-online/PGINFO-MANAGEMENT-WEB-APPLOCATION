import { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — PgInfo",
  description: "Register a new owner or manager account on PgInfo.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090E24] px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/15 to-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full">
        <SignupForm />
      </div>
    </div>
  );
}
