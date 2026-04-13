export const metadata = {
  title: "Not Available | GreenHub 420",
  robots: "noindex, nofollow",
};

export default function BlockedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--gh-color-bg)]">
      <div className="text-center max-w-md px-6">
        <h1 className="text-4xl font-bold text-white mb-4">🇬🇧 UK & Ireland Only</h1>
        <p className="text-white/60 text-lg mb-6">
          GreenHub 420 is only available to customers in the United Kingdom and Ireland.
        </p>
        <p className="text-white/40 text-sm">
          If you believe this is an error, please contact us at{" "}
          <a
            href="mailto:support@greenhub420.co.uk"
            className="text-emerald-400 hover:underline"
          >
            support@greenhub420.co.uk
          </a>
        </p>
      </div>
    </main>
  );
}
