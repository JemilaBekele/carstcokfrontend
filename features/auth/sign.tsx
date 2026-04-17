"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { usePermissionStore } from "@/stores/auth.store";

export default function SignInViewPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const clearPermissions = usePermissionStore((state) => state.clearPermissions);

  // Clear all stored data before login
  const clearAllStoredData = () => {
    try {
      // Clear Zustand permission store
      clearPermissions();
      
      // Clear localStorage items
      localStorage.removeItem('permission-storage');
      localStorage.removeItem('active_theme');
      localStorage.removeItem('nuqs');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear indexedDB (if used)
      if ('indexedDB' in window) {
        indexedDB.databases().then((databases) => {
          databases.forEach((db) => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
      
      // Clear cookies (only those we can access)
      document.cookie.split(';').forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        // Clear common auth cookies
        if (name.includes('auth') || name.includes('session') || name.includes('token')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      console.log('All stored data cleared before login');
    } catch (error) {
      console.warn('Error clearing stored data:', error);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    // Clear all previous data BEFORE login attempt
    clearAllStoredData();

    setLoading(true);

    try {
      // First, clear any existing session
      await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {
        // Ignore if endpoint doesn't exist
      });

      // Then sign in
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/dashboard/inventory'
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Get fresh session data
        const session = await getSession();
        
        if (session?.user) {
          // Force a hard navigation to clear React state
          window.location.href = '/dashboard/profile';
        } else {
          router.replace('/dashboard/profile');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Clear data on component mount (when user visits login page)
  useState(() => {
    clearAllStoredData();
  });

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4 lg:p-8">
      <div className="flex w-full max-w-5xl overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-3xl">
        
        {/* Left Side: Branding/Image Section */}
      <div className="relative hidden w-1/2 lg:block">
  <img 
    src="https://plus.unsplash.com/premium_photo-1692117162332-2701afb100fb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGNhciUyMG9pbHxlbnwwfHwwfHx8MA%3D%3D" 
    alt="Car Oil Inventory" 
    className="absolute inset-0 object-cover w-full h-full"
  />

  {/* Dark overlay only (no color gradient) */}
  <div className="absolute inset-0 bg-black/60 p-12 flex flex-col justify-between text-white">
    <div>
      <div className="flex items-center gap-3 mb-8">
        <svg 
          className="w-12 h-12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 7-3-2-3 2-1-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 15h16v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />
        </svg>
        <span className="text-2xl font-bold tracking-tight">
           Car Oil Inventory Management System
        </span>
      </div>

      <h2 className="text-3xl font-bold mb-4">
      </h2>

      <p className="text-lg opacity-90">
      </p>
    </div>

    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <span className="text-sm"></span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <span className="text-sm"></span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <span className="text-sm"></span>
      </div>
    </div>
  </div>
</div>

        {/* Right Side: Login Form */}
        <div className="w-full p-8 sm:p-12 lg:w-1/2">
          <div className="mb-10">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500">Sign in to manage your oil inventory</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@oilcompany.com"
                  className="w-full py-3.5 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#e94560] focus:ring-4 focus:ring-[#e94560]/10 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3.5 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#e94560] focus:ring-4 focus:ring-[#e94560]/10 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 text-red-600 border border-red-100 bg-red-50 rounded-xl animate-shake">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-[0.98]
                ${loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#1a1a2e] text-white hover:bg-[#2a2a3e] shadow-lg shadow-[#1a1a2e]/20 hover:shadow-xl'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 text-gray-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Sign In to Inventory'
              )}
            </button>
          </form>

       
        </div>
      </div>
    </div>
  );
}