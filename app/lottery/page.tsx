'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import CompetitionTab from './competition';

const API = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.greenhub420.co.uk';

type LotteryData = {
  date: string;
  entries: number;
  minEntries: number;
  prizeAmount: number;
  drawTime: string;
  history: Array<{
    date: string;
    entries: number;
    winner: string | null;
    amount: number;
    cancelled: boolean;
  }>;
};

export default function LuckyHubPage() {
  const [tab, setTab] = useState<'lottery' | 'competition'>('lottery');
  const [data, setData] = useState<LotteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const { token, profile } = useAuth();

  const [walletId, setWalletId] = useState<string>();
  const [authToken, setAuthToken] = useState<string>();

  useEffect(() => {
    fetch(`${API}/api/lottery/status`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Get wallet ID for competition
  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    fetch(`${API}/api/account/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const handle = d?.data?.attributes?.transferHandle || d?.transferHandle;
        if (handle) setWalletId(handle);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ukStr = now.toLocaleString('en-GB', { timeZone: 'Europe/London' });
      const parts = ukStr.split(/[\/,: ]+/);
      const ukNow = new Date(+parts[2], +parts[1]-1, +parts[0], +parts[3], +parts[4], +parts[5] || 0);
      const draw = new Date(ukNow);
      draw.setHours(20, 0, 0, 0);
      if (ukNow >= draw) draw.setDate(draw.getDate() + 1);
      const diff = draw.getTime() - ukNow.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const entries = data?.entries || 0;
  const minEntries = data?.minEntries || 100;
  const progress = Math.min((entries / minEntries) * 100, 100);
  const remaining = minEntries - entries;

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="relative max-w-lg mx-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-center">
          <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            🎰 Lucky Draw
          </span>
        </h1>
        <p className="text-center text-white/30 text-xs mt-1">Daily bonus & competition prizes</p>
      </div>

      {/* Tab Switcher */}
      <div className="max-w-lg mx-auto px-4 mb-4">
        <div className="flex rounded-xl border border-white/8 bg-white/[0.02] p-1 gap-1">
          <button
            onClick={() => setTab('lottery')}
            className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold transition-all ${
              tab === 'lottery'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <span className="text-sm mr-1">🎰</span> Daily £100
          </button>
          <button
            onClick={() => setTab('competition')}
            className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold transition-all ${
              tab === 'competition'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-purple-300 shadow-sm shadow-purple-500/10'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <span className="text-sm mr-1">🎟️</span> Competition
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'lottery' ? (
        <DailyLotteryTab
          data={data}
          loading={loading}
          countdown={countdown}
          entries={entries}
          minEntries={minEntries}
          progress={progress}
          remaining={remaining}
        />
      ) : (
        <CompetitionTab walletId={walletId} authToken={authToken} />
      )}
    </div>
  );
}

/* ── Daily Lottery Tab ── */
function DailyLotteryTab({
  data, loading, countdown, entries, minEntries, progress, remaining
}: {
  data: LotteryData | null; loading: boolean; countdown: string;
  entries: number; minEntries: number; progress: number; remaining: number;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const history = data?.history || [];

  return (
    <div className="max-w-lg mx-auto px-4 pb-32 space-y-4">
      {/* Prize Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5">
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-400/8 blur-3xl" />
        <div className="relative z-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/50 font-bold">Today&apos;s Prize</p>
          <p className="text-4xl font-black text-amber-300 mt-1">£100</p>
          <p className="text-xs text-white/30 mt-1">Bonus credited to winner&apos;s wallet</p>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Participants</span>
          <span className="text-sm font-bold text-white">{entries} / {minEntries}</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {remaining > 0 && (
          <p className="text-[10px] text-amber-400/60 text-center">
            ⚠️ {remaining} more needed for tonight&apos;s draw — minimum {minEntries} required
          </p>
        )}

        <div className="flex justify-between items-center pt-1">
          <span className="text-xs text-white/40">Draw Time</span>
          <span className="text-sm font-bold text-emerald-400">8:00 PM UK</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Countdown</span>
          <span className="text-sm font-bold font-mono text-amber-300">{countdown}</span>
        </div>
      </div>

      {/* How to Enter */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-xs font-bold text-white/60 mb-3">How to Enter</p>
        <div className="space-y-2.5">
          {[
            { step: '1', text: 'Join @greenhub420 channel', sub: 'Required to participate in the lottery', highlight: true },
            { step: '2', text: 'Bind your Wallet ID', sub: 'Message @gh420lottery_bot with /bind GH-XXXXXX' },
            { step: '3', text: 'Click JOIN in channel', sub: 'Tap the pinned JOIN button in @greenhub420 each day' },
            { step: '4', text: 'Wait for 8PM draw', sub: 'Winner announced in channel, £100 credited instantly' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                (s as any).highlight ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30' : 'bg-amber-400/10 text-amber-400'
              }`}>
                {s.step}
              </div>
              <div>
                <p className={`text-xs font-medium ${(s as any).highlight ? 'text-amber-300' : 'text-white/70'}`}>{s.text}</p>
                <p className="text-[9px] text-white/25">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <a href="https://t.me/greenhub420"
            target="_blank" rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition">
            ✈️ Join &amp; Enter
          </a>
          <a href="https://t.me/gh420lottery_bot?start=bind"
            target="_blank" rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/5 py-3 text-xs font-bold text-amber-300 active:scale-[0.98] transition">
            🔗 Bind Wallet
          </a>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs font-bold text-white/60 mb-3">Recent Draws</p>
          <div className="space-y-2">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-xs font-medium text-white/60">{h.date}</p>
                  <p className="text-[9px] text-white/25">{h.entries} entries</p>
                </div>
                <div className="text-right">
                  {h.cancelled ? (
                    <span className="text-[10px] text-red-400/60">Cancelled</span>
                  ) : h.winner ? (
                    <div>
                      <p className="text-[10px] text-emerald-400 font-mono">{h.winner}</p>
                      <p className="text-[9px] text-amber-300">+£{h.amount}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/25">No winner</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
