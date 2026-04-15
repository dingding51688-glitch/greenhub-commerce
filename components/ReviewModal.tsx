"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

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

interface ReviewModalProps {
  productId: number;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ productId, productName, onClose, onSuccess }: ReviewModalProps) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!token) { setError("Please log in to leave a review"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/strapi/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, rating, comment }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#1a1a1e] border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-4 text-white/40 hover:text-white text-xl">✕</button>

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-2xl mb-1">⭐</p>
          <h3 className="text-lg font-bold text-white">Rate your experience</h3>
          <p className="text-sm text-white/50 mt-1">{productName}</p>
        </div>

        {/* Stars */}
        <div className="mb-5">
          <StarPicker value={rating} onChange={setRating} />
          <p className="text-center text-xs text-white/40 mt-2">
            {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
          </p>
        </div>

        {/* Comment */}
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience... (optional)"
            maxLength={500}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-amber-400/50"
          />
          <span className="text-white/30 text-[10px]">{comment.length}/500</span>
        </div>

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold text-sm transition-all"
        >
          {submitting ? "Submitting..." : "Submit Review ⭐"}
        </button>
      </div>
    </div>
  );
}
