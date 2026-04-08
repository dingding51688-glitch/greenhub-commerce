import { getStoredToken } from "@/lib/auth-store";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

export class ReferralApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ReferralApiError";
    this.status = status;
  }
}

async function referralFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!AUTH_BASE) throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
  const token = getStoredToken();
  if (!token) throw new Error("Login required");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const response = await fetch(`${AUTH_BASE}${path}`, {
    ...init,
    headers
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ReferralApiError(payload?.error?.message || "Referral request failed", response.status);
  }
  return (payload?.data ?? payload) as T;
}

export type ReferralSummary = {
  code: string;
  link: string;
  totalInvites: number;
  activeLockers: number;
  bonusEarned: number;
  clicks: number;
  validClicks?: number;
  clickPayoutTotal: number;
  registrations: number;
  topups: number;
  conversionRate: number;
  ctr: number;
  impressions?: number;
  monthCommission?: number;
  totalOrderValue?: number;
  totalConverted?: number;
  totalCommission?: number;
  thirtyDayCommission?: number;
  customers?: Array<{
    email: string;
    orders: number;
    totalSpend: number;
    commission: number;
    lastOrder?: string;
  }>;
};

export async function getReferralSummary() {
  return referralFetch<ReferralSummary>("/api/referrals/me");
}

export type ReferralEvent = {
  id: number;
  inviteeEmail: string;
  status: string;
  locker?: string;
  createdAt: string;
};

export type PaginatedReferralEvents = {
  data: ReferralEvent[];
  meta?: {
    pagination?: {
      page: number;
      pageCount: number;
      total: number;
    };
  };
};

export async function getReferralEvents(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());
  const qs = query.toString();
  return referralFetch<PaginatedReferralEvents>(`/api/referral-events/mine${qs ? `?${qs}` : ""}`);
}

export type CommissionTransaction = {
  id: number | string;
  amount: number;
  status: string;
  reference?: string;
  createdAt: string;
  type?: string;
  sourceInvitee?: string;
};

export type PaginatedCommissionTransactions = {
  data: CommissionTransaction[];
  meta?: {
    pagination?: {
      page: number;
      pageCount: number;
      total: number;
    };
  };
};

export async function getCommissionTransactions(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());
  const qs = query.toString();
  return referralFetch<PaginatedCommissionTransactions>(`/api/commission-transactions/mine${qs ? `?${qs}` : ""}`);
}

export function getReferralCommissions(params?: { page?: number; pageSize?: number }) {
  return getCommissionTransactions(params);
}

export type CommissionHubSummary = {
  code?: string | null;
  link?: string | null;
  totalInvites?: number;
  activeLockers?: number;
  bonusEarned?: number;
  clicks?: number;
  validClicks?: number;
  clickPayoutTotal?: number;
  registrations?: number;
  topups?: number;
  conversionRate?: number;
  ctr?: number;
  impressions?: number;
  monthCommission?: number;
  totalOrderValue?: number;
  totalConverted?: number;
  totalCommission?: number;
  thirtyDayCommission?: number;
};

export type CommissionHubTask = {
  id: number | string;
  title: string;
  description?: string;
  rewardLabel?: string;
  progress?: number;
  state?: string;
};

export type CommissionHubConversion = {
  id: number | string;
  handle?: string;
  status?: string;
  createdAt?: string;
  orderValue?: number;
  commission?: number;
};

export type CommissionHubSnapshot = {
  summary?: CommissionHubSummary | null;
  tasks?: CommissionHubTask[];
  conversions?: CommissionHubConversion[];
  history?: CommissionTransaction[];
};

export async function getCommissionHubSnapshot() {
  return referralFetch<CommissionHubSnapshot>("/api/referrals/commission-hub");
}
