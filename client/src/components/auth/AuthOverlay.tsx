import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://yylxjiqnfkxddhrkzddl.supabase.co";
const defaultSupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bHhqaXFuZmt4ZGRocmt6ZGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODUwNDIsImV4cCI6MjA5OTk2MTA0Mn0.GorcWJDCJJ-JqcaX9O9CNOatuN1YQ2MYBP4ADNVkzA";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthOverlayProps {
  onLogin: (session: any) => void;
}

export function AuthOverlay({ onLogin }: AuthOverlayProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter a valid email and password.");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // ── SIGN UP FLOW ──
      let cloudRegistered = false;
      try {
        const { data, error: sbErr } = await supabase.auth.signUp({ email: cleanEmail, password: cleanPassword });
        if (!sbErr && data) {
          cloudRegistered = true;
        }
      } catch (err) {}

      // Always save to Local Sanctuary Accounts store
      const localAccounts = JSON.parse(localStorage.getItem("aevorin_local_accounts") || "{}");
      localAccounts[cleanEmail] = cleanPassword;
      localStorage.setItem("aevorin_local_accounts", JSON.stringify(localAccounts));

      setSuccess(cloudRegistered
        ? "Account created! Check your email for confirmation, or sign in below."
        : "Account registered successfully! You can now sign in below."
      );
      setIsSignUp(false);
      setLoading(false);
      return;
    } else {
      // ── SIGN IN FLOW ──
      // 1. Try Supabase cloud authentication
      try {
        const { data, error: sbErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (!sbErr && data?.session) {
          localStorage.setItem("aevorin_user_session", JSON.stringify(data.session));
          onLogin(data.session);
          setLoading(false);
          return;
        }
      } catch (err) {}

      // 2. Fallback to Local Sanctuary Accounts store
      const localAccounts = JSON.parse(localStorage.getItem("aevorin_local_accounts") || "{}");
      if (localAccounts[cleanEmail]) {
        if (localAccounts[cleanEmail] === cleanPassword) {
          const localSession = {
            user: {
              id: `user_${cleanEmail}`,
              email: cleanEmail
            }
          };
          localStorage.setItem("aevorin_user_session", JSON.stringify(localSession));
          onLogin(localSession);
          setLoading(false);
          return;
        } else {
          setError("Incorrect password. Please verify your password and try again.");
          setLoading(false);
          return;
        }
      }

      // 3. No account found
      setError("No registered account found with this email. Please click 'Need an account? Sign up.' below to register first.");
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestSession = {
      user: {
        id: "guest_author",
        email: email.trim() || "author@aevorin.local"
      }
    };
    localStorage.setItem("aevorin_guest_session", JSON.stringify(guestSession));
    onLogin(guestSession);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "#0d0b1e", color: "#e2e8f0",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 9999, fontFamily: "var(--font-sans)"
    }}>
      <div style={{
        maxWidth: "400px", width: "90%", padding: "2rem",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "48px", height: "48px", color: "#f5c542", filter: "drop-shadow(0 0 8px rgba(245, 197, 66, 0.4))", marginBottom: "1rem" }}>
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
            <line x1="16" y1="8" x2="2" y2="22" />
            <line x1="17.5" y1="15" x2="9" y2="15" />
          </svg>
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>AEVORIN</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.5rem" }}>Cloud Sync Sanctuary</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="author@domain.com"
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "6px",
                background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", fontSize: "1rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "0.75rem 2.5rem 0.75rem 0.75rem", borderRadius: "6px",
                  background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "white", fontSize: "1rem"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
                  padding: "0.25rem 0.5rem", fontSize: "1.1rem", display: "flex", alignItems: "center"
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <div style={{ color: "#ff6b6b", fontSize: "0.85rem", background: "rgba(255,107,107,0.1)", padding: "0.75rem", borderRadius: "6px", lineHeight: 1.4 }}>{error}</div>}
          {success && <div style={{ color: "#4ade80", fontSize: "0.85rem", background: "rgba(74,222,128,0.1)", padding: "0.75rem", borderRadius: "6px" }}>{success}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem", width: "100%", padding: "0.85rem", borderRadius: "6px",
              background: "#7c3aed", color: "white", border: "none",
              fontSize: "1rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Authenticating..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <button
            type="button"
            onClick={handleGuestLogin}
            style={{
              width: "100%", padding: "0.85rem", borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(224, 142, 109, 0.2), rgba(224, 142, 109, 0.1))",
              color: "#e08e6d", border: "1px solid rgba(224, 142, 109, 0.4)",
              fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
            }}
          >
            🟢 Continue as Guest (Local Workspace)
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "0.5rem", lineHeight: 1.3 }}>
            Your work is stored locally in this browser and is available even without an internet connection.
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none", border: "none", color: "#94a3b8",
              fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline"
            }}
          >
            {isSignUp ? "Already have an account? Sign in." : "Need an account? Sign up."}
          </button>
        </div>
      </div>
    </div>
  );
}
