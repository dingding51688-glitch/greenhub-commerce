"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button";

/* ── Types ── */
interface Stats {
  todayOrders: number;
  todayRevenue: number;
  todayCustomers: number;
  todayTraffic: number;
  todayTopups: number;
  allTopups: number;
  pendingOrders: number;
  shippedOrders: number;
  todayCommission: number;
  allCommission: number;
  totalCustomers: number;
  totalOrders: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  email: string;
  full_name: string;
}

interface RecentTicket {
  id: number;
  subject: string;
  status: string;
  ticket_ref: string;
  created_at: string;
  email: string;
  full_name: string;
}

interface RecentTopup {
  id: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  email: string;
  full_name: string;
}

interface LeaderEntry {
  id: number;
  email: string;
  full_name: string;
  totalCommission?: number;
  totalConversions?: number;
}

/* ── Helpers ── */
const GBP = (n: number) => `£${n.toFixed(2)}`;
const timeAgo = (ts: string | number) => {
  const time = typeof ts === "number" || /^\d+$/.test(String(ts)) ? Number(ts) : new Date(ts).getTime();
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
};

const STATUS_CN: Record<string, string> = {
  pending: "待处理",
  confirmed: "已确认",
  processing: "处理中",
  shipped: "已发货",
  delivered: "已完成",
  cancelled: "已取消",
  finished: "已完成",
  waiting: "等待中",
  open: "待处理",
  closed: "已关闭",
};

const statusColor = (s: string) => {
  if (["pending", "waiting", "open", "processing"].includes(s)) return "text-yellow-300 border-yellow-500/30";
  if (["confirmed", "shipped", "finished", "closed", "delivered"].includes(s)) return "text-green-300 border-green-500/30";
  if (["cancelled", "failed", "expired"].includes(s)) return "text-red-300 border-red-500/30";
  return "text-white/50 border-white/10";
};

/* ── Components ── */
function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-white/50 text-sm">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
    </div>
  );
}

/* ── Main ── */
export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [logging, setLogging] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [recentTopups, setRecentTopups] = useState<RecentTopup[]>([]);
  const [commissionTop, setCommissionTop] = useState<LeaderEntry[]>([]);
  const [conversionTop, setConversionTop] = useState<LeaderEntry[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Check session
  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("gh_admin_token") : null;
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  const handleLogin = async () => {
    setLogging(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setAuthed(true);
        sessionStorage.setItem("gh_admin_token", data.token);
      } else {
        setLoginError(data.error || "登录失败");
      }
    } catch {
      setLoginError("网络错误");
    }
    setLogging(false);
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [s, r, l] = await Promise.all([
        fetch("/api/admin/dashboard/stats", { headers }).then((r) => r.json()),
        fetch("/api/admin/dashboard/recent", { headers }).then((r) => r.json()),
        fetch("/api/admin/dashboard/leaderboard", { headers }).then((r) => r.json()),
      ]);
      if (s.success) setStats(s.data);
      if (r.success) {
        setRecentOrders(r.data.recentOrders || []);
        setRecentTickets(r.data.recentTickets || []);
        setRecentTopups(r.data.recentTopups || []);
      }
      if (l.success) {
        setCommissionTop(l.data.commissionTop || []);
        setConversionTop(l.data.conversionTop || []);
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    if (authed && token) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [authed, token, fetchData]);

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0b0e] p-4">
        <div className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">🌿 Green Hub 管理后台</h1>
            <p className="mt-2 text-sm text-white/40">请登录管理员账号</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="用户名"
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white placeholder:text-white/30 focus:border-green-500/50 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
            <input
              type="password"
              placeholder="密码"
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white placeholder:text-white/30 focus:border-green-500/50 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          {loginError && <p className="text-center text-sm text-red-300">{loginError}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={logging}>
            {logging ? "登录中…" : "登录"}
          </Button>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen bg-[#0a0b0e] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🌿 Green Hub 管理仪表盘</h1>
            {lastRefresh && (
              <p className="mt-1 text-xs text-white/30">
                最后更新：{lastRefresh.toLocaleTimeString("zh-CN")} · 每30秒自动刷新
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={fetchData}>🔄 刷新</Button>
            <Button size="sm" variant="ghost" onClick={() => {
              sessionStorage.removeItem("gh_admin_token");
              setAuthed(false);
              setToken("");
            }}>退出</Button>
          </div>
        </div>

        {!stats ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-white/40">加载中…</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <StatCard icon="🛒" label="今日订单" value={stats.todayOrders} sub={`总计 ${stats.totalOrders} 单`} />
              <StatCard icon="💰" label="今日订单额" value={GBP(stats.todayRevenue)} />
              <StatCard icon="👤" label="今日新用户" value={stats.todayCustomers} sub={`总计 ${stats.totalCustomers} 人`} />
              <StatCard icon="👁" label="今日浏览量" value={stats.todayTraffic} />
              <StatCard icon="💳" label="今日充值" value={GBP(stats.todayTopups)} sub={`总计 ${GBP(stats.allTopups)}`} />
              <StatCard icon="⚠️" label="未处理订单" value={stats.pendingOrders} />
              <StatCard icon="📦" label="已发货订单" value={stats.shippedOrders} />
              <StatCard icon="🏅" label="今日佣金" value={GBP(stats.todayCommission)} sub={`总计 ${GBP(stats.allCommission)}`} />
            </div>

            {/* Recent Activity */}
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {/* Recent Orders */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  🛒 最新订单
                </h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentOrders.length === 0 && <p className="text-sm text-white/40">暂无订单</p>}
                  {recentOrders.map((o) => (
                    <div key={o.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{o.order_number || `#${o.id}`}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(o.status)}`}>
                          {STATUS_CN[o.status] || o.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-green-400 font-medium">{GBP(o.total || 0)}</div>
                      <div className="mt-1 flex items-center justify-between text-xs text-white/40">
                        <span>{o.full_name || o.email || "—"}</span>
                        <span>{timeAgo(o.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  💬 客服工单
                </h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentTickets.length === 0 && <p className="text-sm text-white/40">暂无工单</p>}
                  {recentTickets.map((t) => (
                    <div key={t.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate max-w-[60%]">{t.subject || t.ticket_ref || `#${t.id}`}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(t.status)}`}>
                          {STATUS_CN[t.status] || t.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-white/40">
                        <span>{t.full_name || t.email || "—"}</span>
                        <span>{timeAgo(t.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Topups */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  💳 最新充值
                </h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentTopups.length === 0 && <p className="text-sm text-white/40">暂无充值</p>}
                  {recentTopups.map((tp) => (
                    <div key={tp.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-400">{tp.currency === "GBP" ? GBP(tp.amount || 0) : `${tp.amount} ${tp.currency || ""}`}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(tp.status)}`}>
                          {STATUS_CN[tp.status] || tp.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-white/40">
                        <span>{tp.full_name || tp.email || "—"}</span>
                        <span>{timeAgo(tp.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboards */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Commission Leaderboard */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  🏆 佣金排行榜
                </h2>
                <div className="space-y-2">
                  {commissionTop.length === 0 && <p className="text-sm text-white/40">暂无数据</p>}
                  {commissionTop.map((e, i) => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white/60">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{e.full_name || "—"}</div>
                        <div className="text-xs text-white/40 truncate">{e.email}</div>
                      </div>
                      <span className="text-sm font-bold text-green-400">{GBP(e.totalCommission || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion Leaderboard */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  🎯 客户转化排行榜
                </h2>
                <div className="space-y-2">
                  {conversionTop.length === 0 && <p className="text-sm text-white/40">暂无数据</p>}
                  {conversionTop.filter((e) => (e.totalConversions || 0) > 0).length === 0 && conversionTop.length > 0 && (
                    <p className="text-sm text-white/40">暂无转化记录</p>
                  )}
                  {conversionTop.filter((e) => (e.totalConversions || 0) > 0).map((e, i) => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white/60">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{e.full_name || "—"}</div>
                        <div className="text-xs text-white/40 truncate">{e.email}</div>
                      </div>
                      <span className="text-sm font-bold text-blue-400">{e.totalConversions || 0} 人</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
