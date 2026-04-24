'use client';

export default function CompetitionError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-3">🎟️</p>
        <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-4">{error?.message || 'An error occurred loading the competition.'}</p>
        <button onClick={reset} className="px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-purple-600 hover:bg-purple-500">
          Try again
        </button>
      </div>
    </div>
  );
}
