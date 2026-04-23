"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import Image from "next/image";

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

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

interface UploadedImage {
  id: number;
  url: string;
  preview: string;
}

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
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !token) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError(`Maximum ${MAX_IMAGES} images`); return; }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError("");

    for (const file of toUpload) {
      if (file.size > MAX_FILE_SIZE) {
        setError("Each image must be under 5MB");
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only images are allowed");
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("files", file);

        const res = await fetch("/api/strapi/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          setError("Failed to upload image");
          continue;
        }

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const uploaded = data[0];
          setImages((prev) => [...prev, {
            id: uploaded.id,
            url: uploaded.url,
            preview: uploaded.formats?.thumbnail?.url || uploaded.url,
          }]);
        }
      } catch {
        setError("Upload failed");
      }
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: number) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async () => {
    if (!token) { setError("Please log in to leave a review"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/strapi/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId,
          rating,
          comment,
          orderId,
          tags: selectedTags,
          imageIds: images.map((img) => img.id),
        }),
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

        {/* Photo Upload */}
        <div className="mb-4">
          <p className="text-xs text-white/40 mb-2 text-center">Add photos (optional)</p>
          <div className="flex gap-2 justify-center items-center">
            {images.map((img) => (
              <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                <Image
                  src={img.preview.startsWith("http") ? img.preview : `${process.env.NEXT_PUBLIC_AUTH_BASE_URL || "https://cms.greenhub420.co.uk"}${img.preview}`}
                  alt="Review"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-white/15 hover:border-emerald-500/40 flex flex-col items-center justify-center text-white/30 hover:text-emerald-400 transition-colors"
              >
                {uploading ? (
                  <span className="text-xs animate-pulse">...</span>
                ) : (
                  <>
                    <span className="text-xl leading-none">📷</span>
                    <span className="text-[9px] mt-0.5">{images.length}/{MAX_IMAGES}</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
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

        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold text-sm transition-all"
        >
          {submitting ? "Submitting..." : "Submit Review ⭐"}
        </button>
      </div>
    </div>
  );
}
