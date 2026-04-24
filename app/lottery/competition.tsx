'use client';

import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.greenhub420.co.uk';

type CompData = {
  active: boolean;
  id?: number;
  round?: number;
  status?: string;
  totalTickets?: number;
  ticketPrice?: number;
  soldCount?: number;
  prizePool?: number;
  tickets?: Record<number, { sold: boolean; wallet?: string }>;
  expiresAt?: string;
};

type HistoryItem = {
  round: number;
  soldCount: number;
  prizePool: number;
  winnerTicket: number;
  winnerWallet: string;
  drawnAt: string;
};

export default function CompetitionTab({ walletId, authToken }: { walletId?: string; authToken?: string }) {
  const [data, setData] = useState<CompData | null>(null);
  const [myTickets, setMyTickets] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState('');

  const maxPerUser = 5;

  const loadData = useCallback(async () => {
    try {
      const [compRes, histRes] = await Promise.all([
        fetch(`${API}/api/competition/current`),
        fetch(`${API}/api/competition/history`),
      ]);
      const comp = await compRes.json();
      const hist = await histRes.json();
      setData(comp);
      setHistory(hist.history || []);

      if (walletId && comp.active) {
        const myRes = await fetch(`${API}/api/competition/my-tickets?walletId=${walletId}`);
        const my = await myRes.json();
        setMyTickets(my.tickets || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [walletId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Countdown
  useEffect(() => {
    if (!data?.expiresAt) return;
    const tick = () => {
      const diff = new Date(data.expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setCountdown('Drawing...'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.expiresAt]);

  const toggleTicket = (num: number) => {
    const ticket = data?.tickets?.[num];
    if (ticket?.sold) return;
    setSelected(prev => {
      if (prev.includes(num)) return prev.filter(n => n !== num);
      if (prev.length + myTickets.length >= maxPerUser) return prev;
      return [...prev, num];
    });
    setError('');
  };

  const buyTickets = async (nums?: number[]) => {
    if (!walletId || !authToken) { setError('Please log in first'); return; }
    setBuying(true);
    setError('');
    setSuccess('');
    try {
      const body = nums ? { walletId, numbers: nums } : { walletId, random: maxPerUser - myTickets.length };
      const res = await fetch(`${API}/api/competition/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(`Got tickets: #${result.tickets.join(', #')} · Cost: £${result.cost.toFixed(2)}`);
        setSelected([]);
        await loadData();
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    }
    setBuying(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>;
  }

  if (!data?.active) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-2">🎟️</p>
        <p className="text-gray-400">No active competition right now</p>
        <p className="text-gray-600 text-xs mt-1">Next round coming soon!</p>
      </div>
    );
  }

  const soldCount = data.soldCount || 0;
  const totalTickets = data.totalTickets || 100;
  const ticketPrice = data.ticketPrice || 2;
  const prizePool = data.prizePool || 0;
  const progress = (soldCount / totalTickets) * 100;
  const remaining = maxPerUser - myTickets.length;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Round {data.round}</span>
          <span className="text-xs text-amber-400 font-mono">{countdown}</span>
        </div>
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-2xl font-bold text-emerald-400">£{prizePool.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Prize Pool</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{soldCount}/{totalTickets}</p>
            <p className="text-xs text-gray-500">Tickets Sold</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress >= 100 ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }} />
        </div>
        <p className="text-gray-500 text-xs mt-2">
          {soldCount >= totalTickets ? '🎉 Sold out! Drawing now...' : `${totalTickets - soldCount} tickets left · £${ticketPrice} each · Max ${maxPerUser} per person`}
        </p>
      </div>

      {/* My tickets */}
      {myTickets.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
          <p className="text-xs text-purple-400 font-medium mb-1">🎫 My Tickets ({myTickets.length}/{maxPerUser})</p>
          <div className="flex flex-wrap gap-2">
            {myTickets.sort((a,b)=>a-b).map(n => (
              <span key={n} className="bg-purple-500/20 text-purple-300 text-sm font-mono px-2.5 py-1 rounded-lg">#{String(n).padStart(2, '0')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Ticket grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium">Pick Your Numbers</p>
          {remaining > 0 && <p className="text-xs text-gray-500">{selected.length} selected · {remaining} slots left</p>}
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: totalTickets }, (_, i) => i + 1).map(num => {
            const ticket = data.tickets?.[num];
            const isSold = ticket?.sold;
            const isMine = myTickets.includes(num);
            const isSelected = selected.includes(num);

            let bg = 'bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer';
            if (isSold && isMine) bg = 'bg-purple-500/30 border-purple-500/50 text-purple-300';
            else if (isSold) bg = 'bg-gray-800/50 text-gray-600 cursor-not-allowed';
            else if (isSelected) bg = 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/50';

            return (
              <button
                key={num}
                onClick={() => toggleTicket(num)}
                disabled={isSold || data.status !== 'selling'}
                className={`aspect-square rounded-lg text-xs font-mono font-medium flex items-center justify-center border border-transparent transition-all ${bg}`}
              >
                {String(num).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-800 inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-800/50 inline-block" /> Sold</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500/30 inline-block" /> Mine</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30 inline-block" /> Selected</span>
        </div>
      </div>

      {/* Buy buttons */}
      {data.status === 'selling' && remaining > 0 && (
        <div className="space-y-3">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-sm">{success}</div>}

          <div className="flex gap-3">
            {selected.length > 0 && (
              <button
                onClick={() => buyTickets(selected)}
                disabled={buying}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                {buying ? '...' : `Buy ${selected.length} tickets · £${(selected.length * ticketPrice).toFixed(2)}`}
              </button>
            )}
            <button
              onClick={() => buyTickets()}
              disabled={buying}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white border border-purple-500/30 bg-purple-500/10 disabled:opacity-50"
            >
              {buying ? '...' : `🎲 Random ${remaining}`}
            </button>
          </div>
          <p className="text-center text-xs text-gray-600">Balance only (bonus excluded) · £{ticketPrice}/ticket</p>
        </div>
      )}

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold mb-3 text-sm">🎟️ How Competition Works</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• <strong className="text-white">100 tickets</strong> numbered 01-100, each costs <strong className="text-white">£{ticketPrice}</strong></li>
          <li>• Pick your numbers or let us randomly assign</li>
          <li>• Max <strong className="text-white">{maxPerUser} tickets</strong> per person</li>
          <li>• When all 100 are sold or 24h expires → <strong className="text-amber-400">instant draw</strong></li>
          <li>• <strong className="text-emerald-400">Winner takes the entire pool</strong> (up to £{totalTickets * ticketPrice})</li>
          <li>• Prize is <strong className="text-white">real balance — withdrawable!</strong></li>
          <li>• Your chance = your tickets ÷ total sold</li>
          <li>• New round starts automatically after each draw</li>
        </ul>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 text-sm">🏆 Past Winners</h2>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl text-sm">
                <div>
                  <span className="text-gray-300 font-medium">Round {h.round}</span>
                  <span className="text-gray-500 ml-2 text-xs">{h.soldCount} tickets</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 text-xs font-mono">#{String(h.winnerTicket).padStart(2,'0')}</span>
                  <span className="text-amber-400 text-xs ml-1">£{h.prizePool.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
