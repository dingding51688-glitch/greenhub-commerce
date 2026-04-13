"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

interface Review {
  id: number;
  rating: number;
  comment: string;
  displayName: string;
  createdAt: string;
}

interface ReviewData {
  data: Review[];
  meta: { total: number; avgRating: number };
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "text-lg" : "text-sm";
  return (
    <span className={cls}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-white/20"}>
          ★
        </span>
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
  const [meta, setMeta] = useState({ total: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/strapi/reviews/product/${productId}`)
      .then((r) => r.json())
      .then((d: ReviewData) => {
        setReviews(d.data || []);
        setMeta(d.meta || { total: 0, avgRating: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async () => {
    if (!token) {
      setError("Please log in to leave a review");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/strapi/reviews/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || data?.message || "Failed to submit review");
        return;
      }

      setReviews((prev) => [data.data, ...prev]);
      setMeta((prev) => ({
        total: prev.total + 1,
        avgRating:
          prev.total > 0
            ? Math.round(((prev.avgRating * prev.total + rating) / (prev.total + 1)) * 10) / 10
            : rating,
      }));
      setSuccess(true);
      setShowForm(false);
      setComment("");
      setRating(5);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Reviews</h3>
          {meta.total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(meta.avgRating)} size="lg" />
              <span className="text-white/60 text-sm">
                {meta.avgRating} · {meta.total} review{meta.total !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        {token && !success && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-[#1C1C1E] rounded-xl p-4 mb-4 border border-white/10">
          <div className="mb-3">
            <label className="text-white/60 text-sm mb-1 block">Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="mb-3">
            <label className="text-white/60 text-sm mb-1 block">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              maxLength={500}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-emerald-500/50"
            />
            <span className="text-white/30 text-xs">{comment.length}/500</span>
          </div>
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium text-sm transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-emerald-400 text-sm">
          ✅ Thank you for your review!
        </div>
      )}

      {/* Review List */}
      {loading ? (
        <div className="text-white/30 text-sm">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-white/30 text-sm py-4">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-[#1C1C1E] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{r.displayName}</span>
                  <Stars rating={r.rating} />
                </div>
                <span className="text-white/30 text-xs">
                  <TimeAgo date={r.createdAt} />
                </span>
              </div>
              {r.comment && <p className="text-white/70 text-sm">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
