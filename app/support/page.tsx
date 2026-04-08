"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { contactChannels, contactHeroDetails } from "@/data/fixtures/marketing";
import { useAuth } from "@/components/providers/AuthProvider";

/* ── schema ── */
const ticketSchema = z.object({
  topic: z.enum(["delivery", "payment", "order", "other"]),
  message: z.string().min(20, "Please include at least 20 characters"),
  orderRef: z.string().optional().or(z.literal("")),
  contactEmail: z.string().optional().or(z.literal("")),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

type Ticket = {
  ticketRef: string;
  topic: string;
  status: string;
  priority: string;
  message: string;
  orderRef?: string;
  createdAt: string;
  updatedAt: string;
};

/* ── FAQ ── */
const supportFaq = [
  {
    title: "Locker delivery",
    answer:
      "Enter your postcode at checkout and we automatically reserve the closest InPost locker. Once the parcel lands, you'll receive an email with the locker address and access code. Lockers are open 24/7 — please collect within 72 hours.",
  },
  {
    title: "Payments & balance",
    answer:
      "Top up with USDT (TRC-20); balances display in GBP with live FX. Wallet-to-wallet transfers settle instantly. Withdrawals carry a 3% fee, arrive within 24 hours, and require a £100 minimum (commission earnings count toward that).",
  },
  {
    title: "Track your order",
    answer:
      "Open Account → Orders, tap the order number, and you'll see the live status plus the locker tracking ID. We also email you whenever the status changes so you have inbox + dashboard updates.",
  },
  {
    title: "First-time ordering",
    answer:
      "Register, browse the menu, and at checkout simply provide your postcode so we can match a locker. We'll email the locker address and access code once it's ready. Tip: start with a small USDT top-up to run through the pickup flow before placing larger orders.",
  },
];

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  new: { text: "New", className: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  in_progress: { text: "In progress", className: "border-blue-400/40 bg-blue-400/10 text-blue-200" },
  resolved: { text: "Resolved", className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  escalated: { text: "Escalated", className: "border-red-400/40 bg-red-400/10 text-red-200" },
};

/* ── page ── */
export default function SupportPage() {
  const { token } = useAuth();
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { topic: "delivery", message: "", orderRef: "", contactEmail: "" },
  });

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyToast(`Copied ${value}`);
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      setCopyToast("Unable to copy, please copy manually.");
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  /* ── fetch my tickets ── */
  const loadTickets = useCallback(async () => {
    if (!token) return;
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setTickets(data.data);
      }
    } catch {
      // silent
    } finally {
      setTicketsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  /* ── submit ticket ── */
  const onSubmit = async (values: TicketFormValues) => {
    setFormStatus(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: values.topic,
          message: values.message,
          orderRef: values.orderRef || undefined,
          contactEmail: values.contactEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || "Failed to submit ticket");
      }
      const ref = data?.data?.ticketRef || "";
      setFormStatus({
        type: "success",
        message: ref
          ? `Ticket ${ref} created — support replies within 2 hours.`
          : "Ticket received — support replies within 2 hours.",
      });
      reset();
      loadTickets(); // refresh list
    } catch (error: any) {
      setFormStatus({ type: "error", message: error?.message || "Failed to submit ticket" });
    }
  };

  return (
    <section className="space-y-8">
      {/* ── hero ── */}
      <header className="rounded-[40px] border border-white/10 bg-night-950/80 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Customer support</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">We&apos;re available 09:00–21:00 GMT daily</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {contactHeroDetails.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/15 bg-white/5 p-4 text-sm text-white/80">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="mt-1 block text-white underline">
                  {item.value}
                </a>
              ) : (
                <p className="mt-1 text-white">{item.value}</p>
              )}
            </div>
          ))}
        </div>
        {copyToast && <p className="mt-3 text-xs text-emerald-200">{copyToast}</p>}
      </header>

      {/* ── contact channels ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {contactChannels.map((channel) => (
          <article key={channel.title} className="rounded-[32px] border border-white/10 bg-night-950/70 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">{channel.title}</p>
                <p className="text-2xl font-semibold text-white">{channel.detail}</p>
                <p className="mt-2 text-sm text-white/70">{channel.description}</p>
              </div>
              {channel.badge && (
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">{channel.badge}</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {channel.href && (
                <Button asChild size="sm">
                  <a href={channel.href} target={channel.href.startsWith("http") ? "_blank" : "_self"} rel="noreferrer">
                    Open channel
                  </a>
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => handleCopy(channel.detail)}>
                Copy details
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* ── FAQ ── */}
      <div className="rounded-[40px] border border-white/10 bg-night-950/70 p-6">
        <h2 className="text-2xl font-semibold text-white">Delivery & payment FAQ</h2>
        <div className="mt-4 space-y-3">
          {supportFaq.map((item) => (
            <details key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer text-lg font-semibold text-white">{item.title}</summary>
              <p className="mt-2 text-sm text-white/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>

      {/* ── submit ticket ── */}
      <div className="rounded-[40px] border border-white/10 bg-night-950/70 p-6">
        <h2 className="text-2xl font-semibold text-white">Submit a ticket</h2>
        <p className="text-sm text-white/60">We reply within 2 hours during support hours. Urgent? Text the hotline instead.</p>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            Topic
            <select {...register("topic")} className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white">
              <option value="delivery" className="bg-night-900 text-white">Delivery / pickup</option>
              <option value="payment" className="bg-night-900 text-white">Payment / top-up</option>
              <option value="order" className="bg-night-900 text-white">Order tracking</option>
              <option value="other" className="bg-night-900 text-white">Other</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            Message
            <textarea
              rows={5}
              placeholder="Share as much context as possible"
              className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
              {...register("message")}
            />
            {errors.message && <p className="text-xs text-red-300">{errors.message.message}</p>}
          </label>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            Order reference (optional)
            <input
              type="text"
              placeholder="ORD-1234567"
              className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
              {...register("orderRef")}
            />
          </label>
          {!token && (
            <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
              Contact email (optional — so we can reply)
              <input
                type="email"
                placeholder="you@example.com"
                className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
                {...register("contactEmail")}
              />
            </label>
          )}
          {formStatus && (
            <StateMessage variant={formStatus.type === "success" ? "info" : "error"} title={formStatus.message} />
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send ticket"}
          </Button>
        </form>
      </div>

      {/* ── my tickets ── */}
      {token && (
        <div className="rounded-[40px] border border-white/10 bg-night-950/70 p-6">
          <h2 className="text-2xl font-semibold text-white">My tickets</h2>
          {ticketsLoading ? (
            <p className="mt-3 text-sm text-white/50">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">No tickets yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {tickets.map((t) => {
                const statusInfo = STATUS_LABELS[t.status] || STATUS_LABELS.new;
                return (
                  <article
                    key={t.ticketRef}
                    className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-white">{t.ticketRef}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/50">
                          {t.topic} {t.orderRef ? `· ${t.orderRef}` : ""} ·{" "}
                          {new Date(t.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/70 line-clamp-2">{t.message}</p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
