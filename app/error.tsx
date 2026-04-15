"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <p className="text-4xl">😵</p>
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="text-sm text-white/50">An error occurred. Try refreshing.</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => reset()} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-colors">Try again</button>
          <button onClick={() => window.location.href = "/products"} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 font-medium text-sm transition-colors">Go to Shop</button>
        </div>
      </div>
    </div>
  );
}
