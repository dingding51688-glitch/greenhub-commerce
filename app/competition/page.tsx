'use client';

import { useEffect, useState } from 'react';
import CompetitionTab from '../lottery/competition';

const API = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.greenhub420.co.uk';

export default function CompetitionPage() {
  const [walletId, setWalletId] = useState<string>();
  const [authToken, setAuthToken] = useState<string>();

  useEffect(() => {
    try {
      const token = window.localStorage.getItem('bv:auth-token');
      if (token) {
        setAuthToken(token);
        fetch(`${API}/api/account/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
          .then(r => r.json())
          .then(d => {
            const handle = d?.data?.attributes?.transferHandle || d?.transferHandle;
            if (handle) setWalletId(handle);
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-amber-900/20" />
        <div className="relative max-w-lg mx-auto px-4 pt-10 pb-6 text-center">
          <div className="text-5xl mb-3">🎟️</div>
          <h1 className="text-2xl font-bold mb-1">Competition</h1>
          <p className="text-gray-400 text-sm">Pick your numbers · Win the prize pool · Withdrawable!</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
        <CompetitionTab walletId={walletId} authToken={authToken} />
      </div>
    </div>
  );
}
