"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    setSignupDone(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display font-bold text-2xl tracking-tight text-ink">Golddust</span>
          <span className="font-display font-bold text-2xl tracking-tight text-gold">Studio</span>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex gap-1 bg-surface2 border border-border rounded p-0.5 mb-5">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                  setSignupDone(false);
                }}
                className={cn(
                  "flex-1 px-3 py-1.5 text-sm rounded",
                  mode === m ? "bg-gold text-white" : "text-ink-secondary"
                )}
              >
                {m === "signin" ? "Connexion" : "Créer un compte"}
              </button>
            ))}
          </div>

          {signupDone ? (
            <p className="text-sm text-ink-secondary text-center py-4">
              Compte créé. Vérifie ta boîte mail (<span className="text-ink">{email}</span>) et clique sur le
              lien de confirmation pour activer ton accès.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-ink-secondary mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-xs text-ink-secondary mb-1 block">Mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-dark transition-colors text-white text-sm font-medium py-2 rounded disabled:opacity-50"
              >
                {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
