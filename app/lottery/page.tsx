'use client';

import { useEffect, useState } from 'react';

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

export default function LotteryPage() {
  const [data, setData] = useState<LotteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    fetch(`${API}/api/lottery/status`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const progress = data ? Math.min((data.entries / data.minEntries) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-gray-950 to-purple-900/20" />
        <div className="relative max-w-lg mx-auto px-4 pt-12 pb-8 text-center">
          <div className="text-5xl mb-3">🎰</div>
          <h1 className="text-2xl font-bold mb-1">Daily £100 Lottery</h1>
          <p className="text-gray-400 text-sm">Every day at 8:00 PM · 1 winner · £100 bonus</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 pb-24">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Next Draw In</p>
          <p className="text-3xl font-mono font-bold text-emerald-400">{countdown}</p>
          <p className="text-gray-500 text-xs mt-1">8:00 PM UK Time</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">Today&apos;s Entries</span>
            <span className="text-emerald-400 font-bold text-lg">{data?.entries || 0} / {data?.minEntries || 100}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress >= 100 ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #F59E0B, #FBBF24)' }} />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {progress >= 100 ? '✅ Minimum reached — draw will happen tonight!' : `Need ${(data?.minEntries || 100) - (data?.entries || 0)} more entries`}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 text-sm">📌 How to Join</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex gap-3"><span className="text-lg">1️⃣</span><span>Register at <a href="/register" className="text-emerald-400 underline">greenhub420.co.uk</a></span></div>
            <div className="flex gap-3"><span className="text-lg">2️⃣</span><span>Copy your Wallet ID from <a href="/wallet" className="text-emerald-400 underline">Wallet page</a></span></div>
            <div className="flex gap-3"><span className="text-lg">3️⃣</span><span>Join our <a href="https://t.me/gh420lottery_bot?start=bind" className="text-emerald-400 underline">Telegram group</a> and bind wallet</span></div>
            <div className="flex gap-3"><span className="text-lg">4️⃣</span><span>Click JOIN button daily to enter</span></div>
          </div>
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <span className="text-emerald-400 text-sm font-medium">🎁 First-time bind = FREE £5 bonus!</span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 text-sm">⚠️ Rules</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Minimum <strong className="text-white">100 entries</strong> required for draw</li>
            <li>• One entry per person per day</li>
            <li>• Multiple accounts = cheating → ban</li>
            <li>• Prize is <strong className="text-white">£100 site bonus</strong> (non-withdrawable)</li>
          </ul>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 text-sm">📊 Draw History</h2>
          {(!data?.history || data.history.length === 0) ? (
            <p className="text-gray-500 text-sm text-center py-4">No draws yet — be the first winner! 🎉</p>
          ) : (
            <div className="space-y-2">
              {data.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl text-sm">
                  <div>
                    <span className="text-gray-300 font-medium">{h.date}</span>
                    <span className="text-gray-500 ml-2 text-xs">{h.entries} entries</span>
                  </div>
                  {h.cancelled ? (
                    <span className="text-amber-400 text-xs">❌ Cancelled</span>
                  ) : (
                    <div className="text-right">
                      <span className="text-emerald-400 text-xs font-mono">{h.winner}</span>
                      <span className="text-gray-500 text-xs ml-1">£{h.amount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <a href="https://t.me/gh420lottery_bot?start=join" className="block w-full text-center py-4 rounded-2xl font-bold text-lg" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          🎰 Join Telegram Lottery Group
        </a>
      </div>
    </div>
  );
}
