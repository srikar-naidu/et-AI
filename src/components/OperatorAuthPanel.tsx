"use client";

import { FormEvent, useEffect, useState } from "react";
import { Lock, LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseClient, isSupabaseClientConfigured } from "@/lib/supabase/client";

type SessionUser = { email?: string | null } | null;

export default function OperatorAuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<SessionUser>(null);
  const [message, setMessage] = useState("Connect Supabase Auth to enable operator sign-in.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setMessage("Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable operator access.");
      return;
    }

    client.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        setMessage(`Signed in as ${data.session.user.email ?? "operator"}.`);
      }
    });

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setMessage(`Signed in as ${session.user.email ?? "operator"}.`);
      } else {
        setMessage("Operator access is available. Sign in to use protected workflows.");
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const client = getSupabaseClient();
    if (!client) {
      setMessage("Supabase client credentials are not configured.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message || "Sign-in failed.");
    } else {
      setMessage("Operator session created. Case workflows can now use authenticated access.");
      setPassword("");
    }
    setIsSubmitting(false);
  }

  async function handleSignOut() {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
    setMessage("Signed out of the operator console.");
  }

  return (
    <section className="mt-8 rounded-xl border border-[#333] bg-black/35 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#00f3ff]">
          <ShieldCheck className="size-5" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.24em]">Operator access</h2>
        </div>
        {user ? <span className="rounded-full border border-[#00ff66]/40 bg-[#00ff66]/10 px-3 py-1 text-xs font-semibold text-[#00ff66]">Signed in</span> : <span className="rounded-full border border-[#333] px-3 py-1 text-xs font-semibold text-gray-400">Pending sign-in</span>}
      </div>

      <p className="mt-3 text-sm text-gray-400">
        This is the authentication foundation for protected case operations. Evidence files remain private in Supabase Storage and are not publicly exposed.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm text-gray-200">
            Operator email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-white outline-none focus:border-[#00f3ff]" placeholder="ops@example.com" required />
          </label>
          <label className="block text-sm text-gray-200">
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-white outline-none focus:border-[#00f3ff]" placeholder="••••••••" required />
          </label>
          <button type="submit" disabled={isSubmitting || !isSupabaseClientConfigured()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#00f3ff] px-4 font-mono text-sm font-bold text-black transition-colors hover:bg-[#63f7ff] disabled:cursor-not-allowed disabled:opacity-60">
            <LogIn className="size-4" /> {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="rounded-lg border border-[#333] bg-[#111] p-4 text-sm text-gray-300">
          <div className="flex items-center gap-2 text-[#00f3ff]">
            <UserRound className="size-4" />
            <span className="font-semibold">Current session</span>
          </div>
          <p className="mt-3 text-sm text-gray-400">{message}</p>
          {user && (
            <button type="button" onClick={handleSignOut} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#ff003c]/50 px-3 text-sm font-semibold text-[#ff003c] hover:bg-[#ff003c]/10">
              <LogOut className="size-4" /> Sign out
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
