"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-10 max-w-md rounded-3xl border border-white/10 bg-card p-6">
      <h2 className="text-2xl font-semibold text-white">Sign in</h2>
      <p className="mt-1 text-sm text-white/60">Use your GreenHub email + password</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
          Email or username
          <input
            className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </label>
        <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-white/60">
        Need an account? <Link className="text-brand-200" href="/register">Register</Link>
      </p>
    </section>
  );
}
