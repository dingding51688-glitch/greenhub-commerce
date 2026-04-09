import { apiFetch } from "@/lib/api";
import type { WithdrawalListResponse, WithdrawalRequest } from "@/lib/types";

export type CreateWithdrawalPayload = {
  amount: number;
  currency?: string;
  payoutMethod: "bank" | "crypto" | "wallet" | string;
  payoutDetails: Record<string, unknown>;
  note?: string;
};

export type CreateWithdrawalResponse = {
  success: boolean;
  request: WithdrawalRequest;
};

const normalizePayload = (payload: CreateWithdrawalPayload) => {
  const amount = Number(payload.amount);
  const method = payload.payoutMethod === "crypto" ? "usdt_wallet" : payload.payoutMethod === "bank" ? "uk_bank" : payload.payoutMethod;
  const currency = "USDT";
  const body: Record<string, unknown> = { amount, currency, method, note: payload.note?.trim() || undefined };
  const details = (payload.payoutDetails || {}) as Record<string, any>;
  if (method === "uk_bank") {
    body.bankFullName = details.accountName;
    body.bankAccountNumber = details.accountNumber;
    body.bankSortCode = details.sortCode;
    if (details.reference) body.bankReference = details.reference;
  } else if (method === "usdt_wallet") {
    body.usdtNetwork = (details.network || "TRC20").toUpperCase();
    body.usdtAddress = details.address;
  }
  return body;
};

export async function createWithdrawalRequest(payload: CreateWithdrawalPayload) {
  const response = await apiFetch<{ success: boolean; data: WithdrawalRequest | null }>("/api/account/withdrawals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizePayload(payload))
  });
  let request = response.data || null;
  if (!request) {
    try {
      const latest = await apiFetch<WithdrawalListResponse>("/api/account/withdrawals?page=1&pageSize=1");
      request = latest.data?.[0] || null;
    } catch (error) {
      console.error("Failed to load latest withdrawal after POST", error);
    }
  }
  return { success: response.success, request: request || undefined } as CreateWithdrawalResponse;
}

export async function listWithdrawalRequests(params?: { page?: number; pageSize?: number }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", params.page.toString());
  if (params?.pageSize) search.set("pageSize", params.pageSize.toString());
  const qs = search.toString();
  const path = `/api/account/withdrawals${qs ? `?${qs}` : ""}`;
  return apiFetch<WithdrawalListResponse>(path);
}
