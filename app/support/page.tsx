"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";

const ticketSchema = z.object({
  topic: z.enum(["delivery", "payment", "order", "other"]),
  message: z.string().min(20, "At least 20 characters"),
  orderRef: z.string().optional().or(z.literal("")),
  contactEmail: z.string().optional().or(z.literal("")),
});
type TicketForm = z.infer<typeof ticketSchema>;

type Ticket = { ticketRef: string; topic: string; status: string; message: string; orderRef?: string; createdAt: string };

const FAQ = [
  { q: "How does delivery work?", a: "We ship to InPost lockers across the UK. Enter your postcode at checkout — we'll assign the nearest locker. Once ready, you get an email with the access code. Lockers are 24/7, collect within 72 hours." },
  { q: "How do I pay?", a: "Top up your wallet with USDT (crypto) or bank transfer via our Telegram bot. Balances show in GBP. Wallet-to-wallet transfers are instant and free." },
  { q: "How do I track my order?", a: "Go to Account → Orders and tap your order number. You'll see live status + tracking ID. We also email you on every status change." },
  { q: "What's the return policy?", a: "Due to the nature of our products, we do not accept returns. If there's an issue with your order, contact support and we'll resolve it." },
  { q: "How long does delivery take?", a: "3–5 business days. You'll receive a tracking number within 24 hours of dispatch. The locker holds your package for 72 hours." },
  { q: "What about withdrawals?", a: "Minimum £100, 3% fee, arrives within 24 hours. Bank transfer or USDT supported." },
];

const STATUS: Record<string, { text: string; cls: string }> = {
  new: { text: "New", cls: "bg-amber-400/10 text-amber-300" },
  in_progress: { text: "In Progress", cls: "bg-blue-400/10 text-blue-300" },
  resolved: { text: "Resolved", cls: "bg-emerald-400/10 text-emerald-300" },
  escalated: { text: "Escalated", cls: "bg-red-400/10 text-red-300" },
};

const inputCls = "mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25";

export default function SupportPage() {
  const { token } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { topic: "delivery", message: "", orderRef: "", contactEmail: "" },
  });

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) setTickets(data.data);
    } catch {} finally { setTicketsLoading(false); }
  }, [token]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const onSubmit = async (values: TicketForm) => {
    setFormStatus(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: values.topic, message: values.message, orderRef: values.orderRef || undefined, contactEmail: values.contactEmail || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed");
      setFormStatus({ type: "success", message: `Ticket ${data?.data?.ticketRef || ""} created — we reply within 2 hours.` });
      reset(); loadTickets();
    } catch (err: any) { setFormStatus({ type: "error", message: err?.message || "Failed" }); }
  };

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Support</h1>
        <p className="mt-1 text-xs text-white/40">Available 09:00–21:00 GMT daily</p>
      </div>

      {/* Telegram channel banner */}
      <a href="https://t.me/greenhub420" target="_blank" rel="noopener noreferrer"
        className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-blue-400/25 bg-gradient-to-r from-blue-500/15 via-blue-400/10 to-transparent px-4 py-3.5 active:scale-[0.98] transition">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-400/10 blur-2xl" />
        <span className="relative text-2xl">✈️</span>
        <div className="relative flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Join our Telegram</p>
          <p className="text-[10px] text-blue-300/60">Exclusive deals, new drops &amp; updates</p>
        </div>
        <span className="relative rounded-full bg-blue-400/20 px-2.5 py-1 text-[10px] font-bold text-blue-300">Join</span>
      </a>

      {/* Quick contact */}
      <div className="grid grid-cols-2 gap-2">
        <a href="https://t.me/chineseinbelfast1" target="_blank" rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-blue-400/20 bg-blue-400/5 py-4 transition hover:bg-blue-400/10">
          <span className="text-2xl">💬</span>
          <p className="text-xs font-bold text-blue-300">Telegram DM</p>
          <p className="text-[9px] text-blue-300/50">Fastest response</p>
        </a>
        <a href="mailto:support@greenhub420.co.uk"
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 py-4 transition hover:bg-emerald-400/10">
          <span className="text-2xl">📧</span>
          <p className="text-xs font-bold text-emerald-300">Email</p>
          <p className="text-[9px] text-emerald-300/50">support@greenhub420.co.uk</p>
        </a>
      </div>

      {/* Response time */}
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
        <span className="text-lg">⚡</span>
        <div>
          <p className="text-xs font-semibold text-white">Average response: 30 minutes</p>
          <p className="text-[10px] text-white/30">During support hours · Telegram is fastest</p>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="text-sm font-bold text-white mb-2">Frequently Asked</p>
        <div className="space-y-1.5">
          {FAQ.map((item, i) => (
            <button
              key={i}
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              className="w-full rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">{item.q}</p>
                <span className={`text-white/30 transition ${expandedFaq === i ? "rotate-180" : ""}`}>▾</span>
              </div>
              {expandedFaq === i && (
                <p className="mt-2 text-xs text-white/40 leading-relaxed">{item.a}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Submit ticket */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-bold text-white">Submit a Ticket</p>
        <p className="mt-1 text-[10px] text-white/30">We reply within 2 hours during support hours</p>

        <form className="mt-3 space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Topic</label>
            <select {...register("topic")} className={inputCls + " bg-white/[0.04]"}>
              <option value="delivery" className="bg-[#0a0a0a]">Delivery / Pickup</option>
              <option value="payment" className="bg-[#0a0a0a]">Payment / Top-up</option>
              <option value="order" className="bg-[#0a0a0a]">Order Tracking</option>
              <option value="other" className="bg-[#0a0a0a]">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Message</label>
            <textarea rows={4} placeholder="Describe your issue..." {...register("message")} className={inputCls} />
            {errors.message && <p className="mt-1 text-[10px] text-red-300">{errors.message.message}</p>}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Order Ref (optional)</label>
            <input type="text" placeholder="ORD-1234567" {...register("orderRef")} className={inputCls} />
          </div>

          {!token && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40">Email (so we can reply)</label>
              <input type="email" placeholder="you@example.com" {...register("contactEmail")} className={inputCls} />
            </div>
          )}

          {formStatus && (
            <div className={`rounded-xl border px-3 py-2 text-xs ${formStatus.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>
              {formStatus.message}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="flex w-full min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white disabled:opacity-40">
            {isSubmitting ? "Sending…" : "Send Ticket"}
          </button>
        </form>
      </div>

      {/* My tickets */}
      {token && tickets.length > 0 && (
        <div>
          <p className="text-sm font-bold text-white mb-2">My Tickets</p>
          <div className="space-y-1.5">
            {tickets.map((t) => {
              const s = STATUS[t.status] || STATUS.new;
              return (
                <div key={t.ticketRef} className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-white">{t.ticketRef}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${s.cls}`}>{s.text}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/30">{t.topic} · {new Date(t.createdAt).toLocaleDateString("en-GB")}</p>
                  <p className="mt-1 text-xs text-white/40 line-clamp-1">{t.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
