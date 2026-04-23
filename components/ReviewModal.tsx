"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

const REVIEW_TAGS = [
  { id: "potent", label: "🔥 Potent", emoji: "🔥" },
  { id: "great-taste", label: "😍 Great Taste", emoji: "😍" },
  { id: "fast-delivery", label: "🚀 Fast Delivery", emoji: "🚀" },
  { id: "no-smell", label: "👃 No Smell", emoji: "👃" },
  { id: "good-value", label: "💰 Good Value", emoji: "💰" },
  { id: "smooth", label: "🌊 Smooth", emoji: "🌊" },
  { id: "nice-buds", label: "🌿 Nice Buds", emoji: "🌿" },
  { id: "strong-high", label: "💫 Strong High", emoji: "💫" },
];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-3 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`text-3xl transition-transform hover:scale-110 ${i <= value ? "text-yellow-400" : "text-white/20 hover:text-yellow-400/50"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const ratingLabels: Record<number, string> = {
  5: "Excellent! 🔥",
  4: "Great! 👍",
  3: "Good 👌",
  2: "Fair 😐",
  1: "Poor 👎",
};

interface ReviewModalProps {
  productId: number;
  productName: string;
  orderId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ productId, productName, orderId, onClose, onSuccess }: ReviewModalProps) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ productId, rating, comment, orderId, tags: selectedTags }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || data?.message || "Failed to submit"); return; }
      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[#1a1a1e] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-4 text-white/40 hover:text-white text-xl">✕</button>

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-2xl mb-1">⭐</p>
          <h3 className="text-lg font-bold text-white">Rate your experience</h3>
          <p className="text-sm text-white/50 mt-1 line-clamp-1">{productName}</p>
        </div>

        {/* Stars */}
        <div className="mb-5">
          <StarPicker value={rating} onChange={setRating} />
          <p className="text-center text-xs text-white/50 mt-2">{ratingLabels[rating]}</p>
        </div>

        {/* Tags */}
        <div className="mb-5">
          <p className="text-xs text-white/40 mb-2 text-center">What stood out?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {REVIEW_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-white/5 text-white/50 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything else to share? (optional)"
            maxLength={500}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-emerald-500/50"
            style={{ fontSize: "16px" }}
          />
          <span className="text-white/30 text-[10px]">{comment.length}/500</span>
        </div>

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold text-sm transition-all"
        >
          {submitting ? "Submitting..." : "Submit Review ⭐"}
        </button>
      </div>
    </div>
  );
}
