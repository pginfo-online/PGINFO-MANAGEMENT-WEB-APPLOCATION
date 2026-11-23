import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — PgInfo",
  description: "Sign in to access your properties, beds, dues, and tenants.",
};

export default function LoginPage() {
  return (
    <main className="workspace-login">
      <LoginForm />
    </main>
  );
}
