"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

const TAG_LABELS: Record<string, string> = {
  potent: "🔥 Potent",
  "great-taste": "😍 Great Taste",
  "fast-delivery": "🚀 Fast Delivery",
  "no-smell": "👃 No Smell",
  "good-value": "💰 Good Value",
  smooth: "🌊 Smooth",
  "nice-buds": "🌿 Nice Buds",
  "strong-high": "💫 Strong High",
};

const REVIEW_TAGS = [
  { id: "potent", label: "🔥 Potent" },
  { id: "great-taste", label: "😍 Great Taste" },
  { id: "fast-delivery", label: "🚀 Fast Delivery" },
  { id: "no-smell", label: "👃 No Smell" },
  { id: "good-value", label: "💰 Good Value" },
  { id: "smooth", label: "🌊 Smooth" },
  { id: "nice-buds", label: "🌿 Nice Buds" },
  { id: "strong-high", label: "💫 Strong High" },
];

interface Review {
  id: number;
  rating: number;
  comment: string;
  tags: string[];
  displayName: string;
  createdAt: string;
}

interface ReviewMeta {
  total: number;
  avgRating: number;
  distribution: Record<number, number>;
  tagCounts: Record<string, number>;
}

interface ReviewData {
  data: Review[];
  meta: ReviewMeta;
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "text-lg" : "text-sm";
  return (
    <span className={cls}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-white/15"}>★</span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`text-2xl transition-colors ${i <= value ? "text-yellow-400" : "text-white/20 hover:text-yellow-400/50"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function RatingDistribution({ distribution, total }: { distribution: Record<number, number>; total: number }) {
  if (total === 0) return null;
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-white/50 w-4 text-right">{star}</span>
            <span className="text-yellow-400 text-xs">★</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400/80 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-white/30 w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function TopTags({ tagCounts }: { tagCounts: Record<string, number> }) {
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (sorted.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {sorted.map(([tag, count]) => (
        <span key={tag} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px]">
          {TAG_LABELS[tag] || tag} ({count})
        </span>
      ))}
    </div>
  );
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return <span>{new Date(date).toLocaleDateString("en-GB")}</span>;
  if (days > 0) return <span>{days}d ago</span>;
  if (hours > 0) return <span>{hours}h ago</span>;
  if (mins > 0) return <span>{mins}m ago</span>;
  return <span>Just now</span>;
}

export function ReviewSection({ productId }: { productId: number }) {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<ReviewMeta>({ total: 0, avgRating: 0, distribution: {}, tagCounts: {} });
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/strapi/reviews/product/${productId}`)
      .then((r) => r.json())
      .then((d: ReviewData) => {
        setReviews(d.data || []);
        setMeta(d.meta || { total: 0, avgRating: 0, distribution: {}, tagCounts: {} });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!token) { setError("Please log in to leave a review"); return; }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/strapi/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, rating, comment, tags: selectedTags }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || data?.message || "Failed to submit review"); return; }

      setReviews((prev) => [{ ...data.data, tags: data.data.tags || [] }, ...prev]);
      setMeta((prev) => {
        const newTotal = prev.total + 1;
        const newAvg = prev.total > 0
          ? Math.round(((prev.avgRating * prev.total + rating) / newTotal) * 10) / 10
          : rating;
        const newDist = { ...prev.distribution };
        newDist[rating] = (newDist[rating] || 0) + 1;
        const newTagCounts = { ...prev.tagCounts };
        selectedTags.forEach((t) => { newTagCounts[t] = (newTagCounts[t] || 0) + 1; });
        return { total: newTotal, avgRating: newAvg, distribution: newDist, tagCounts: newTagCounts };
      });
      setSuccess(true);
      setShowForm(false);
      setComment("");
      setRating(5);
      setSelectedTags([]);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      {/* Summary Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-white">Reviews</h3>
          {meta.total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{meta.avgRating}</span>
              <div>
                <Stars rating={Math.round(meta.avgRating)} size="lg" />
                <p className="text-white/40 text-xs">{meta.total} review{meta.total !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
        </div>
        {token && !success && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-medium"
          >
            ✍️ Write Review
          </button>
        )}
      </div>

      {/* Rating Distribution + Top Tags */}
      {meta.total > 0 && (
        <div className="bg-[#1C1C1E] rounded-xl p-4 mb-5 border border-white/5">
          <RatingDistribution distribution={meta.distribution} total={meta.total} />
          <TopTags tagCounts={meta.tagCounts} />
        </div>
      )}

      {/* Inline Review Form */}
      {showForm && (
        <div className="bg-[#1C1C1E] rounded-xl p-4 mb-4 border border-white/10">
          <div className="mb-3">
            <label className="text-white/60 text-xs mb-1.5 block">Your rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Tag picker */}
          <div className="mb-3">
            <label className="text-white/60 text-xs mb-1.5 block">What stood out?</label>
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-white/60 text-xs mb-1.5 block">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              maxLength={500}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-emerald-500/50"
              style={{ fontSize: "16px" }}
            />
            <span className="text-white/30 text-[10px]">{comment.length}/500</span>
          </div>
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium text-sm transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-emerald-400 text-sm text-center">
          ✅ Thank you for your review!
        </div>
      )}

      {/* Review List */}
      {loading ? (
        <div className="text-white/30 text-sm py-4">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/30 text-sm">No reviews yet</p>
          <p className="text-white/20 text-xs mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-[#1C1C1E] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-400 font-bold">
                    {r.displayName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="text-white font-medium text-sm">{r.displayName}</span>
                  <Stars rating={r.rating} />
                </div>
                <span className="text-white/25 text-[10px]">
                  <TimeAgo date={r.createdAt} />
                </span>
              </div>

              {/* Tags */}
              {r.tags && r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {r.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-[10px]">
                      {TAG_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>
              )}

              {r.comment && <p className="text-white/60 text-sm leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
