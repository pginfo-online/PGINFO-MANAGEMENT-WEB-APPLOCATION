import { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — PgInfo",
  description: "Register a new owner or manager account on PgInfo.",
};

export default function SignupPage() {
  return (
    <main className="workspace-login">
      <SignupForm />
    </main>
  );
}
