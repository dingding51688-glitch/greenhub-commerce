"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import type { WithdrawalRequest } from "@/lib/types";
import { listWithdrawalRequests } from "@/lib/withdrawal-api";
import { withdrawalFixture } from "@/data/fixtures/withdrawals";

const PAGE_SIZE = 10;
const DATE_FMT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending", statuses: ["pending"] },
  { id: "approved", label: "Approved", statuses: ["approved"] },
  { id: "paid", label: "Paid", statuses: ["paid", "completed"] },
  { id: "rejected", label: "Rejected", statuses: ["rejected", "blocked"] }
] as const;

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-200" },
  approved: { label: "Approved", className: "bg-blue-500/10 text-blue-200" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-200" },
  completed: { label: "Paid", className: "bg-emerald-500/10 text-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-200" },
  blocked: { label: "Blocked", className: "bg-red-500/10 text-red-200" }
};

export default function WithdrawalHistoryPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [filterId, setFilterId] = useState<(typeof FILTERS)[number]["id"]>("all");

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate
  } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (!token) return null;
      if (previousPageData && previousPageData.data.length === 0) return null;
      return ["withdrawals", pageIndex + 1];
    },
    async ([, page]) => listWithdrawalRequests({ page, pageSize: PAGE_SIZE }),
    { revalidateFirstPage: true }
  );

  const withdrawals = useMemo(() => (data ? data.flatMap((page) => page.data ?? []) : []), [data]);
  const loadingInitial = !!token && !data && !error;
  const hasMore = Boolean(data && data[data.length - 1]?.data?.length === PAGE_SIZE);

  const selectedFilter = FILTERS.find((filter) => filter.id === filterId) ?? FILTERS[0];
  const filteredRows = useMemo(() => {
    if (selectedFilter.id === "all") return withdrawals;
    const statuses = new Set<string>(selectedFilter.statuses as readonly string[]);
    return withdrawals.filter((row) => statuses.has(row.status));
  }, [withdrawals, selectedFilter]);

  if (!token) {
    return (
      <section className="space-y-6 px-4 py-10">
        <StateMessage
          title="Sign in required"
          body="Log in to view withdrawal history."
          actionLabel="Go to login"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  const fallbackRows = withdrawalFixture;

  return (
    <section className="space-y-6 px-4 py-8">
      <header className="space-y-2">
        <a href="/wallet" className="text-xs text-white/40 hover:text-white/60">← Back to wallet</a>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Withdrawal history</h1>
        <p className="text-sm leading-relaxed text-white/70">Track every payout request. Pending items will be updated by the team once verified.</p>
      </header>

      {/* Filter pills — horizontally scrollable on mobile */}
      <div className="flex items-center gap-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterId(filter.id)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                filterId === filter.id ? "border-white bg-white/10 text-white" : "border-white/10 text-white/70 hover:border-white/30"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => mutate()}
          className="shrink-0 rounded-full border border-white/15 px-3 py-2.5 text-sm text-white/70 hover:border-white/40"
        >
          ↻
        </button>
      </div>

      {loadingInitial ? (
        <SkeletonList />
      ) : error && withdrawals.length === 0 ? (
        <div className="space-y-6">
          <StateMessage
            variant="error"
            title="Unable to load withdrawal history"
            body={error.message}
            actionLabel="Retry"
            onAction={() => mutate()}
          />
          <WithdrawalList
            rows={fallbackRows}
            loadingMore={false}
            showLoadMore={false}
          />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-card p-6 text-center sm:p-8">
          <p className="text-3xl">📭</p>
          <h3 className="mt-3 text-lg font-semibold text-white">
            {filterId === "all" ? "No withdrawal requests yet" : "No records for this filter"}
          </h3>
          <p className="mt-2 text-sm text-white/60">Submit a withdrawal to see it logged here.</p>
          <button
            onClick={() => router.push("/wallet/withdraw")}
            className="mt-5 inline-flex w-full min-h-[48px] items-center justify-center rounded-full bg-brand-500 px-6 text-base font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-400 sm:w-auto"
          >
            New withdrawal
          </button>
        </div>
      ) : (
        <WithdrawalList
          rows={filteredRows}
          loadingMore={isValidating && !!data}
          showLoadMore={hasMore}
          onLoadMore={() => setSize(size + 1)}
        />
      )}
    </section>
  );
}

function WithdrawalList({
  rows,
  loadingMore,
  showLoadMore,
  onLoadMore
}: {
  rows: WithdrawalRequest[];
  loadingMore: boolean;
  showLoadMore: boolean;
  onLoadMore?: () => void;
}) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <WithdrawalCard key={row.reference || row.id} request={row} />
      ))}
      {showLoadMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full min-h-[48px] rounded-full border border-white/20 px-4 text-sm font-semibold text-white hover:border-white/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

function WithdrawalCard({ request }: { request: WithdrawalRequest }) {
  const statusMeta = STATUS_MAP[request.status] ?? { label: request.status, className: "bg-white/10 text-white" };
  const detailEntries = Object.entries(request.payoutDetails || {})
    .filter(([, value]) => value)
    .slice(0, 3);

  return (
    <article className="space-y-3 rounded-3xl border border-white/10 bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">{request.reference || `#${request.id}`}</p>
          <h3 className="text-2xl font-semibold text-white">{GBP.format(request.amount)}</h3>
          <p className="text-xs text-white/50">Method: {request.payoutMethod}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60">
          {request.createdAt && <span>{DATE_FMT.format(new Date(request.createdAt))}</span>}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
        </div>
      </div>
      {detailEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs text-white/70 sm:grid-cols-3">
          {detailEntries.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className="uppercase tracking-[0.25em] text-white/40">{key}</p>
              <p className="truncate text-white">{String(value)}</p>
            </div>
          ))}
        </div>
      )}
      {request.notes && <p className="text-xs text-amber-200">Note: {request.notes}</p>}
    </article>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="h-32 animate-pulse rounded-3xl bg-white/5" />
      ))}
    </div>
  );
}
