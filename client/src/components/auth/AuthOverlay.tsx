import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthOverlayProps {
  onLogin: (session: any) => void;
}

export function AuthOverlay({ onLogin }: AuthOverlayProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email for the confirmation link!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          onLogin(data.session);
        }
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
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
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "6px",
                background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", fontSize: "1rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "6px",
                background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", fontSize: "1rem"
              }}
            />
          </div>

          {error && <div style={{ color: "#ff6b6b", fontSize: "0.85rem", background: "rgba(255,107,107,0.1)", padding: "0.5rem", borderRadius: "4px" }}>{error}</div>}
          {success && <div style={{ color: "#4ade80", fontSize: "0.85rem", background: "rgba(74,222,128,0.1)", padding: "0.5rem", borderRadius: "4px" }}>{success}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "1rem", width: "100%", padding: "0.85rem", borderRadius: "6px",
              background: "#7c3aed", color: "white", border: "none",
              fontSize: "1rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Authenticating..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
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
