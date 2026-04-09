"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/ui/button";

interface GalleryItem {
  url: string;
  alt: string;
}

interface ProductImageZoomProps {
  imageUrl?: string | null;
  imageAlt: string;
  badge?: string | null;
  gallery?: GalleryItem[];
}

export function ProductImageZoom({ imageUrl, imageAlt, badge, gallery = [] }: ProductImageZoomProps) {
  // Build full image list: main image + gallery
  const allImages: GalleryItem[] = [];
  if (imageUrl) allImages.push({ url: imageUrl, alt: imageAlt });
  gallery.forEach((g) => {
    if (g.url && !allImages.some((i) => i.url === g.url)) allImages.push(g);
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeElementRef = useRef<Element | null>(null);

  const currentImage = allImages[activeIndex] ?? { url: imageUrl ?? "", alt: imageAlt };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    activeElementRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((p) => (p > 0 ? p - 1 : allImages.length - 1));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((p) => (p < allImages.length - 1 ? p + 1 : 0));
      }
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, allImages.length]);

  const handleOpen = () => {
    if (!currentImage.url) return;
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    const el = activeElementRef.current as HTMLElement | null;
    if (el) el.focus();
  };

  const toggleZoom = () => {
    setScale((prev) => {
      const next = prev === 1 ? 2 : 1;
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    toggleZoom();
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) toggleZoom();
    lastTapRef.current = now;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scale === 1) return;
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragOriginRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.preventDefault();
    setOffset({ x: event.clientX - dragOriginRef.current.x, y: event.clientY - dragOriginRef.current.y });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.preventDefault();
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    setIsDragging(false);
  };

  const modal =
    isMounted && isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm text-white"
            role="dialog"
            aria-modal="true"
            aria-label="Full image preview"
            onClick={handleClose}
          >
            <div className="flex h-full flex-col" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 text-sm text-white/70">
                <span>{currentImage.alt}{allImages.length > 1 ? ` (${activeIndex + 1}/${allImages.length})` : ""}</span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="rounded-full border border-white/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center px-4 pb-8">
                {/* Prev/Next arrows */}
                {allImages.length > 1 && (
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                    onClick={() => setActiveIndex((p) => (p > 0 ? p - 1 : allImages.length - 1))}
                  >
                    ‹
                  </button>
                )}
                {allImages.length > 1 && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                    onClick={() => setActiveIndex((p) => (p < allImages.length - 1 ? p + 1 : 0))}
                  >
                    ›
                  </button>
                )}
                <div
                  className="relative h-full max-h-[85vh] w-full max-w-5xl overflow-hidden"
                  onDoubleClick={handleDoubleClick}
                  onClick={handleTap}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  role="presentation"
                >
                  {currentImage.url ? (
                    <div
                      className="pointer-events-auto relative h-full w-full"
                      style={{
                        transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                        transition: isDragging ? "none" : "transform 0.2s ease",
                      }}
                    >
                      <Image
                        src={currentImage.url}
                        alt={currentImage.alt}
                        fill
                        sizes="100vw"
                        className="select-none object-contain"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/60">No preview available</div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-[32px] border border-white/15 bg-[radial-gradient(circle_at_top,#0d1b13,#050505)] cursor-zoom-in"
        onClick={handleOpen}
      >
        {currentImage.url ? (
          <Image src={currentImage.url} alt={currentImage.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-6" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Locker preview coming soon</div>
        )}
        {badge && (
          <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white">
            {badge}
          </span>
        )}
      </div>

      {/* Gallery thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === activeIndex ? "border-brand-400 ring-1 ring-brand-400/50" : "border-white/10 hover:border-white/30"
              }`}
            >
              <Image src={img.url} alt={img.alt} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-400">Tap image to enlarge</p>
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={handleOpen} disabled={!currentImage.url}>
          View full image
        </Button>
      </div>
      {modal}
    </div>
  );
}
