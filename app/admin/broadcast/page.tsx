"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";

type Campaign = {
  id: number;
  title: string;
  body: string;
  channels: string[];
  audienceType: string;
  audienceFilter: any;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  ctaLabel?: string;
  ctaUrl?: string;
  sentAt?: string;
  createdAt: string;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "border-white/20 bg-white/5 text-white/60" },
  queued: { label: "排队中", color: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  sending: { label: "发送中", color: "border-blue-400/40 bg-blue-400/10 text-blue-200" },
  done: { label: "已完成", color: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  failed: { label: "失败", color: "border-red-400/40 bg-red-400/10 text-red-200" },
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: "全部用户",
  single: "单个用户",
  segment: "条件筛选",
};

export default function BroadcastPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [sending, setSending] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* ── form state ── */
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [audienceType, setAudienceType] = useState("all");
  const [singleEmail, setSingleEmail] = useState("");
  const [segmentRegion, setSegmentRegion] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── fetch ── */
  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      if (data?.success) setCampaigns(data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  /* ── create ── */
  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) {
      showToast("error", "请填写标题和正文");
      return;
    }
    const channels: string[] = [];
    if (channelInApp) channels.push("in_app");
    if (channelEmail) channels.push("email");
    if (!channels.length) {
      showToast("error", "至少选择一个发送渠道");
      return;
    }

    let audienceFilter: any = null;
    if (audienceType === "single") {
      if (!singleEmail.trim()) {
        showToast("error", "请输入目标用户邮箱");
        return;
      }
      audienceFilter = { email: singleEmail.trim() };
    } else if (audienceType === "segment" && segmentRegion.trim()) {
      audienceFilter = { region: segmentRegion.trim().toUpperCase() };
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          channels,
          audienceType,
          audienceFilter,
          ctaLabel: ctaLabel.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "创建失败");
      showToast("success", `草稿已创建 (ID: ${data.data.id})`);
      resetForm();
      loadCampaigns();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── send ── */
  const handleSend = async (id: number) => {
    if (!confirm(`确认发送广播 #${id}？发送后不可撤回。`)) return;
    setSending(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error?.message || "发送失败");
      showToast("success", `正在发送给 ${data.data.totalRecipients} 人…`);
      // Poll for completion
      setTimeout(() => loadCampaigns(), 3000);
      setTimeout(() => loadCampaigns(), 8000);
      setTimeout(() => loadCampaigns(), 15000);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSending(null);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setChannelInApp(true);
    setChannelEmail(true);
    setAudienceType("all");
    setSingleEmail("");
    setSegmentRegion("");
    setCtaLabel("");
    setCtaUrl("");
    setShowComposer(false);
  };

  const inputClass = "mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30";
  const labelClass = "block text-xs font-medium uppercase tracking-[0.2em] text-white/50";

  return (
    <section className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">管理工具</p>
          <h1 className="text-2xl font-semibold text-white">广播通知</h1>
        </div>
        <Button onClick={() => setShowComposer(!showComposer)}>
          {showComposer ? "取消" : "＋ 新建广播"}
        </Button>
      </div>

      {toast && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${toast.type === "success" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-red-400/40 bg-red-400/10 text-red-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── composer ── */}
      {showComposer && (
        <div className="rounded-[40px] border border-white/10 bg-night-950/80 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">新建广播</h2>

          <div>
            <label className={labelClass}>标题</label>
            <input
              className={inputClass}
              placeholder="通知标题（用户可见）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>正文</label>
            <textarea
              className={inputClass}
              rows={4}
              placeholder="通知内容…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>发送渠道</label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={channelInApp}
                  onChange={(e) => setChannelInApp(e.target.checked)}
                  className="rounded border-white/30"
                />
                站内通知
              </label>
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.checked)}
                  className="rounded border-white/30"
                />
                邮件
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>发送对象</label>
            <select
              className={inputClass}
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value)}
            >
              <option value="all" className="bg-night-900">全部用户</option>
              <option value="single" className="bg-night-900">单个用户</option>
              <option value="segment" className="bg-night-900">按地区筛选</option>
            </select>
          </div>

          {audienceType === "single" && (
            <div>
              <label className={labelClass}>目标用户邮箱</label>
              <input
                className={inputClass}
                placeholder="user@example.com"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
              />
            </div>
          )}

          {audienceType === "segment" && (
            <div>
              <label className={labelClass}>Postcode 前缀（如 BT、M、L）</label>
              <input
                className={inputClass}
                placeholder="BT"
                value={segmentRegion}
                onChange={(e) => setSegmentRegion(e.target.value)}
              />
            </div>
          )}

          <details className="text-sm text-white/50">
            <summary className="cursor-pointer">高级选项</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className={labelClass}>按钮文字（可选）</label>
                <input
                  className={inputClass}
                  placeholder="查看详情"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>按钮链接（可选）</label>
                <input
                  className={inputClass}
                  placeholder="https://www.greenhub420.co.uk/products"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            </div>
          </details>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "创建中…" : "保存草稿"}
            </Button>
            <Button variant="secondary" onClick={resetForm}>取消</Button>
          </div>
        </div>
      )}

      {/* ── campaign list ── */}
      <div className="rounded-[40px] border border-white/10 bg-night-950/70 p-6">
        <h2 className="text-lg font-semibold text-white">广播记录</h2>
        {loading ? (
          <p className="mt-3 text-sm text-white/50">加载中…</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">暂无广播记录</p>
        ) : (
          <div className="mt-4 space-y-3">
            {campaigns.map((c) => {
              const st = STATUS_MAP[c.status] || STATUS_MAP.draft;
              return (
                <article
                  key={c.id}
                  className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/40">#{c.id}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${st.color}`}>{st.label}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40">
                      {AUDIENCE_LABELS[c.audienceType] || c.audienceType}
                    </span>
                    {c.channels?.includes("in_app") && <span className="text-xs text-white/40">📱站内</span>}
                    {c.channels?.includes("email") && <span className="text-xs text-white/40">📧邮件</span>}
                  </div>
                  <h3 className="mt-2 font-semibold text-white">{c.title}</h3>
                  <p className="mt-1 text-sm text-white/60 line-clamp-2">{c.body}</p>
                  {(c.status === "done" || c.status === "sending") && (
                    <p className="mt-2 text-xs text-white/40">
                      已发送 {c.sentCount}/{c.totalRecipients}
                      {c.failedCount > 0 && <span className="text-red-300"> · {c.failedCount} 失败</span>}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-white/30">
                    {c.sentAt
                      ? `发送于 ${new Date(c.sentAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}`
                      : `创建于 ${new Date(c.createdAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}`
                    }
                  </p>
                  {(c.status === "draft" || c.status === "failed") && (
                    <Button
                      className="mt-3 w-full"
                      onClick={() => handleSend(c.id)}
                      disabled={sending === c.id}
                    >
                      {sending === c.id ? "发送中…" : "🚀 确认发送"}
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
