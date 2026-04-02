import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6 text-center">
      <h2 className="text-2xl font-semibold">Choose a workspace</h2>
      <p className="text-white/70">Quick links while we expand the dashboard.</p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/account"
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-brand-500 hover:bg-brand-500/10"
        >
          Go to Account Overview
        </Link>
        <Link
          href="/orders"
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-brand-500 hover:bg-brand-500/10"
        >
          Go to Orders
        </Link>
      </div>
    </section>
  );
}
