'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.greenhub420.co.uk';

type DrawRecord = {
  round: number;
  soldCount: number;
  totalTickets: number;
  prizePool: number;
  winnerTicket: number;
  winnerWallet: string | null;
  drawnAt: string;
};

type MyRound = {
  round: number;
  myTickets: number[];
  winnerTicket: number;
  won: boolean;
  drawnAt: string;
  soldCount: number;
};

const TABS = [
  { id: 'all', label: 'All Draws' },
  { id: 'mine', label: 'My Tickets' },
] as const;

export default function CompetitionHistoryPage() {
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [draws, setDraws] = useState<DrawRecord[]>([]);
  const [myRounds, setMyRounds] = useState<MyRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletId, setWalletId] = useState<string>();

  useEffect(() => {
    try {
      const token = window.localStorage.getItem('bv:auth-token');
      if (token) {
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

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/competition/history`);
      const data = await res.json();
      setDraws(data.history || []);

      if (walletId) {
        const myRes = await fetch(`${API}/api/competition/my-history?walletId=${walletId}`);
        const myData = await myRes.json();
        setMyRounds(myData.rounds || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [walletId]);

  useEffect(() => { loadData(); }, [loadData]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Stats
  const totalDraws = draws.length;
  const totalWinners = draws.filter(d => d.winnerWallet).length;
  const totalNoWinner = draws.filter(d => !d.winnerWallet).length;
  const myWins = myRounds.filter(r => r.won).length;
  const myTotalTickets = myRounds.reduce((sum, r) => sum + r.myTickets.length, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/competition" className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <h1 className="text-lg font-bold">Competition History</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">{totalDraws}</p>
            <p className="text-[10px] text-gray-500 uppercase">Total Draws</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{totalWinners}</p>
            <p className="text-[10px] text-gray-500 uppercase">Winners</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{totalNoWinner}</p>
            <p className="text-[10px] text-gray-500 uppercase">No Winner</p>
          </div>
        </div>

        {/* My stats (if logged in) */}
        {walletId && myRounds.length > 0 && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎫</span>
              <div>
                <p className="text-sm font-medium text-purple-300">{myTotalTickets} tickets purchased</p>
                <p className="text-xs text-gray-500">{myRounds.length} rounds entered</p>
              </div>
            </div>
            {myWins > 0 && (
              <div className="text-right">
                <p className="text-emerald-400 font-bold">🏆 {myWins}</p>
                <p className="text-[10px] text-gray-500">wins</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl mb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? t.id === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-500'
              }`}
            >
              {t.label}
              {t.id === 'mine' && myRounds.length > 0 && (
                <span className="ml-1 text-xs opacity-60">({myRounds.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : tab === 'all' ? (
          /* All Draws */
          draws.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-2">🎰</p>
              <p className="text-gray-400">No draws yet</p>
              <p className="text-gray-600 text-xs mt-1">Results will appear here after the first draw</p>
              <Link href="/competition" className="inline-block mt-4 text-emerald-400 text-sm underline">Go to Competition →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {draws.map((d, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Round {d.round}</span>
                      {d.winnerWallet ? (
                        <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full">WINNER</span>
                      ) : (
                        <span className="bg-amber-500/15 text-amber-400 text-[10px] font-medium px-2 py-0.5 rounded-full">NO WINNER</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(d.drawnAt)}</span>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <span className="text-amber-300 font-mono font-bold text-lg">#{String(d.winnerTicket).padStart(2, '0')}</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Winning Number</p>
                          <p className="text-xs text-gray-400">{d.soldCount}/{d.totalTickets || 100} tickets sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {d.winnerWallet ? (
                          <>
                            <p className="text-emerald-400 font-mono text-sm font-medium">{d.winnerWallet}</p>
                            <p className="text-emerald-400/60 text-xs">Won £200</p>
                          </>
                        ) : (
                          <p className="text-amber-400/60 text-xs">Ticket not sold</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Tickets */
          !walletId ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-2">🔒</p>
              <p className="text-gray-400">Sign in to view your tickets</p>
              <Link href="/login" className="inline-block mt-4 text-emerald-400 text-sm underline">Log in →</Link>
            </div>
          ) : myRounds.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-2">🎟️</p>
              <p className="text-gray-400">No tickets purchased yet</p>
              <Link href="/competition" className="inline-block mt-4 text-emerald-400 text-sm underline">Buy tickets →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myRounds.map((r, i) => (
                <div key={i} className={`bg-gray-900 border rounded-xl overflow-hidden ${r.won ? 'border-emerald-500/30' : 'border-gray-800'}`}>
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Round {r.round}</span>
                      {r.won ? (
                        <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full">🏆 YOU WON!</span>
                      ) : (
                        <span className="bg-gray-700/50 text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded-full">Not this time</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(r.drawnAt)}</span>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">My tickets</p>
                      <p className="text-xs text-gray-500">Draw: <span className="text-amber-400 font-mono font-medium">#{String(r.winnerTicket).padStart(2,'0')}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.myTickets.map(n => (
                        <span
                          key={n}
                          className={`text-xs font-mono px-2.5 py-1 rounded-lg ${
                            n === r.winnerTicket
                              ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400/50 font-bold'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          #{String(n).padStart(2, '0')}
                          {n === r.winnerTicket && ' 🏆'}
                        </span>
                      ))}
                    </div>
                    {r.won && (
                      <div className="mt-2 bg-emerald-500/10 rounded-lg p-2 text-center">
                        <span className="text-emerald-400 text-sm font-medium">+£200 credited to your wallet</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
