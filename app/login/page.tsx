import type { Metadata } from "next";
import SignInViewPage from "@/features/auth/sign";

export const metadata: Metadata = {
  title: "Authentication | Sign In",
  description: "Sign in to access your inventory dashboard.",
};

export default function LoginPage() {
  return <SignInViewPage />;
}
