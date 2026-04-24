'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  const entries = data?.entries || 0;
  const minEntries = data?.minEntries || 100;
  const progress = Math.min((entries / minEntries) * 100, 100);
  const remaining = minEntries - entries;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-950 to-emerald-900/20" />
        <div className="relative max-w-lg mx-auto px-4 pt-10 pb-6 text-center">
          <div className="text-5xl mb-3">🎰</div>
          <h1 className="text-2xl font-bold mb-1">Daily £100 Bonus Lottery</h1>
          <p className="text-gray-400 text-sm">Every night at 8:00 PM UK time, we randomly pick 1 lucky winner</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 pb-24">


        {/* Countdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Next Draw</p>
          <p className="text-3xl font-mono font-bold text-emerald-400">{countdown}</p>
          <p className="text-gray-500 text-xs mt-2">Prize: <span className="text-amber-400 font-semibold">£100 bonus</span> (usable for purchases on site)</p>
        </div>

        {/* Progress - with clear explanation */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Today&apos;s Entries</span>
            <span className="text-emerald-400 font-bold text-lg">{entries} / {minEntries}</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-3.5 overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress >= 100
                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                  : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
              }}
            />
          </div>

          {/* Explanation */}
          <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <p>⚠️ <strong className="text-white">Minimum {minEntries} participants required</strong> — if fewer than {minEntries} people enter, tonight&apos;s draw is <span className="text-amber-400">cancelled</span>.</p>
            {progress >= 100 ? (
              <p className="text-emerald-400 font-medium">✅ Minimum reached! Draw will happen at 8:00 PM tonight!</p>
            ) : (
              <p>📢 Need <span className="text-amber-400 font-semibold">{remaining} more</span> entries to activate tonight&apos;s draw. Invite your friends!</p>
            )}
          </div>
        </div>

        {/* How to Join - step by step */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4 text-sm">📌 How to Participate</h2>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-400">1</div>
              <div>
                <p className="text-sm font-medium text-white">Create an account</p>
                <p className="text-xs text-gray-500 mt-0.5">Sign up at greenhub420.co.uk — it&apos;s free</p>
                <Link href="/register" className="inline-block mt-1.5 text-xs text-emerald-400 underline">Register now →</Link>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-400">2</div>
              <div>
                <p className="text-sm font-medium text-white">Copy your Wallet ID</p>
                <p className="text-xs text-gray-500 mt-0.5">Log in → go to Wallet page → copy your ID (e.g. GH-A1B2C3D4)</p>
                <Link href="/wallet" className="inline-block mt-1.5 text-xs text-emerald-400 underline">Go to Wallet →</Link>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400">3</div>
              <div>
                <p className="text-sm font-medium text-white">Join Telegram &amp; bind wallet</p>
                <p className="text-xs text-gray-500 mt-0.5">Follow our channel + open the Lottery Bot → send <code className="bg-gray-800 px-1.5 py-0.5 rounded text-emerald-400">/bind GH-XXXXX</code> with your Wallet ID</p>
                <div className="flex gap-2 mt-1.5">
                  <a href="https://t.me/greenhub420" className="text-xs text-blue-400 underline">📢 Follow channel</a>
                  <a href="https://t.me/gh420lottery_bot?start=bind" className="text-xs text-blue-400 underline">🤖 Open Bot</a>
                </div>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-400">4</div>
              <div>
                <p className="text-sm font-medium text-white">Enter the lottery daily</p>
                <p className="text-xs text-gray-500 mt-0.5">Go to the lottery group and tap the <strong className="text-white">🎰 JOIN</strong> button every day before 8 PM</p>
                <a href="https://t.me/gh420lottery_bot?start=join" className="inline-block mt-1.5 text-xs text-amber-400 underline">Enter lottery group →</a>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <span className="text-emerald-400 text-sm font-medium">🎁 First-time wallet bind = instant FREE £5 bonus!</span>
          </div>
        </div>

        {/* Requirements summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 text-sm">✅ Entry Requirements</h2>
          <div className="space-y-2.5">
            {[
              { icon: '🌐', text: 'Registered account on greenhub420.co.uk' },
              { icon: '🔗', text: 'Wallet bound to Telegram via Lottery Bot' },
              { icon: '📢', text: 'Following @greenhub420 Telegram channel' },
              { icon: '🎰', text: 'Tap JOIN button in lottery group each day' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-base">{r.icon}</span>
                <span className="text-gray-300">{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 text-sm">⚠️ Rules</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Draw only happens if <strong className="text-white">{minEntries}+ people</strong> entered that day</li>
            <li>• One entry per person per day — resets at midnight</li>
            <li>• One Telegram account per person — multi-accounting = permanent ban</li>
            <li>• Unbinding wallet after entry = entry removed</li>
            <li>• Prize: <strong className="text-white">£100 bonus</strong> credited to winner&apos;s wallet</li>
            <li>• Bonus is for site purchases only, <strong className="text-amber-400">not withdrawable</strong></li>
          </ul>
        </div>

        {/* History */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 text-sm">📊 Draw History</h2>
          {(!data?.history || data.history.length === 0) ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🏆</p>
              <p className="text-gray-500 text-sm">No draws yet — be the first winner!</p>
              <p className="text-gray-600 text-xs mt-1">Results will appear here after the first draw</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl text-sm">
                  <div>
                    <span className="text-gray-300 font-medium">{h.date}</span>
                    <span className="text-gray-500 ml-2 text-xs">{h.entries} entries</span>
                  </div>
                  {h.cancelled ? (
                    <span className="text-amber-400 text-xs">Cancelled (&lt;{minEntries})</span>
                  ) : (
                    <div className="text-right">
                      <span className="text-emerald-400 text-xs font-mono">{h.winner}</span>
                      <span className="text-gray-500 text-xs ml-1">won £{h.amount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <a
            href="https://t.me/gh420lottery_bot?start=join"
            className="block w-full text-center py-4 rounded-2xl font-bold text-lg text-white"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            🎰 Join Lottery on Telegram
          </a>
          <div className="flex gap-3">
            <a
              href="https://t.me/greenhub420"
              className="flex-1 text-center py-3 rounded-xl font-medium text-sm text-blue-400 border border-blue-500/20 bg-blue-500/5"
            >
              📢 Follow Channel
            </a>
            <Link
              href="/register"
              className="flex-1 text-center py-3 rounded-xl font-medium text-sm text-emerald-400 border border-emerald-500/20 bg-emerald-500/5"
            >
              📝 Register Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
