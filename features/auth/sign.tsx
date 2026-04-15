"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { usePermissionStore } from "@/stores/auth.store";

export default function SignInViewPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const clearPermissions = usePermissionStore(
    (state) => state.clearPermissions,
  );

  const clearAuthClientState = () => {
    try {
      clearPermissions();
      localStorage.removeItem("permission-storage");
    } catch (error) {
      console.warn("Error clearing auth client state:", error);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    clearAuthClientState();

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/dashboard/profile",
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.replace(result.url || "/dashboard/profile");
        router.refresh();
        return;
      }
      setError("Unable to establish session. Please try again.");
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Left side with luxury image */}
      <div
        className="hidden bg-cover bg-center lg:flex lg:w-1/2"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/3a/2f/80/3a2f80c2b92f7b527e79658a5a15c9f2.jpg')",
        }}
      >
        <div className="bg-opacity-40 flex h-full w-full flex-col justify-between bg-black p-12">
          <div className="flex items-center space-x-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
              style={{ color: "#D4AF37" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
            <span className="text-2xl font-semibold tracking-wide text-white">
              Inventory
            </span>
          </div>
        </div>
      </div>

      {/* Right side with login form */}
      <div className="flex w-full items-center justify-center bg-gray-900 p-8 lg:w-1/2">
        <div className="bg-opacity-60 border-opacity-40 w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-10 shadow-2xl backdrop-blur-md">
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-3xl font-light tracking-wider text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400">
              Sign in to access your inventory dashboard
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-opacity-50 w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 transition-all duration-300 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-opacity-50 w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 transition-all duration-300 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {error && (
              <p className="bg-opacity-30 rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium transition-all duration-300"
              style={{
                backgroundColor: loading ? "#6b7280" : "#D4AF37",
                color: loading ? "#d1d5db" : "#1f2937",
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-gray-900"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              <a
                href="#"
                className="transition-colors duration-300 hover:text-yellow-400"
                style={{ color: "#D4AF37" }}
              >
                Forgot your password?
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
