"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(username, email, password);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-10 max-w-md rounded-3xl border border-white/10 bg-card p-6">
      <h2 className="text-2xl font-semibold text-white">Create account</h2>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
          Username
          <input
            className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
        <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
          Confirm password
          <input
            type="password"
            className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-sm text-white/60">
        Already have an account? <Link className="text-brand-200" href="/login">Login</Link>
      </p>
    </section>
  );
}
