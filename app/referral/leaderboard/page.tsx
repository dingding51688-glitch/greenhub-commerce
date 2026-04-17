"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";

type LeaderboardEntry = {
  rank: number;
  userAlias: string;
  ordersDriven: number;
  lifetimeCommission: number;
  lastMonthCommission: number;
};

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.data || []);

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ReferralLeaderboardPage() {
  const { token } = useAuth();
  const { data: leaderboard = [], isLoading } = useSWR<LeaderboardEntry[]>("/api/referral/leaderboard", fetcher);

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">🏆 Leaderboard</h1>
        <p className="mt-1 text-xs text-white/40">Top earners ranked by lifetime commission</p>
      </div>

      {/* Top 3 podium */}
      {!isLoading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-2">
          {leaderboard.slice(0, 3).map((entry, i) => (
            <div key={entry.rank}
              className={`rounded-2xl border p-3 text-center ${
                i === 0 ? "border-yellow-400/30 bg-yellow-400/5" :
                i === 1 ? "border-gray-300/20 bg-gray-300/5" :
                "border-amber-600/20 bg-amber-600/5"
              }`}>
              <span className="text-2xl">{MEDALS[i]}</span>
              <p className="mt-1 text-sm font-bold text-white">{entry.userAlias}</p>
              <p className="text-xs font-semibold text-emerald-400">{GBP.format(entry.lifetimeCommission)}</p>
              <p className="text-[9px] text-white/30">{entry.ordersDriven} orders</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/40">Loading leaderboard...</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && leaderboard.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-2 text-sm font-medium text-white/60">No data yet</p>
          <p className="mt-1 text-xs text-white/30">Start referring friends to climb the board!</p>
        </div>
      )}

      {/* Full list */}
      {!isLoading && leaderboard.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-white/30">All Rankings</p>
            <p className="text-[10px] text-white/20">{leaderboard.length} members</p>
          </div>
          <div className="divide-y divide-white/5">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white/40">
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{entry.userAlias}</p>
                  <p className="text-[10px] text-white/30">{entry.ordersDriven} orders · This month: {GBP.format(entry.lastMonthCommission)}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-emerald-400">{GBP.format(entry.lifetimeCommission)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-xs font-bold text-white mb-2">Rules</p>
        <div className="space-y-1.5 text-[11px] text-white/40 leading-relaxed">
          <p>• Only genuine referrals count — no fake accounts or manipulation</p>
          <p>• Commission from approved transactions only</p>
          <p>• Names are anonymized for privacy</p>
          <p>• Accounts abusing the system will be removed</p>
        </div>
      </div>

      {/* CTA */}
      {!token ? (
        <Link href="/register"
          className="flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white active:scale-[0.98]">
          Sign Up to Start Earning 🚀
        </Link>
      ) : (
        <Link href="/account/commission"
          className="flex w-full min-h-[48px] items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/5 text-sm font-bold text-emerald-300 active:scale-[0.98]">
          ← Back to Earn Hub
        </Link>
      )}
    </div>
  );
}
