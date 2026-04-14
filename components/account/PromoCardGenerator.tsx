"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Button from "@/components/ui/button";

/* ─── Promo templates ─── */
const TEMPLATES = [
  {
    id: "welcome",
    label: "🎁 New User Deal",
    headline: "Get Premium Bud\nDelivered to Your Locker",
    body: "Sign up with my link and enjoy top-shelf strains with discreet InPost delivery across the UK.",
    cta: "SHOP NOW →",
    gradient: ["#064e3b", "#0d9488", "#065f46"],
    accent: "#34d399",
  },
  {
    id: "savings",
    label: "💷 Save Big",
    headline: "Why Pay\nStreet Prices?",
    body: "Premium indoor flower from £6/g. Vacuum-sealed, lab-tested, delivered to your nearest InPost locker.",
    cta: "CHECK PRICES →",
    gradient: ["#1e1b4b", "#4338ca", "#312e81"],
    accent: "#818cf8",
  },
  {
    id: "discreet",
    label: "📦 Discreet",
    headline: "No Meetups.\nNo Hassle.\nJust Quality.",
    body: "Order online, pick up from any InPost locker 24/7. Sealed packaging, no questions asked.",
    cta: "ORDER NOW →",
    gradient: ["#18181b", "#3f3f46", "#27272a"],
    accent: "#a1a1aa",
  },
  {
    id: "refer",
    label: "🤝 Earn Cash",
    headline: "Share & Earn\nUp to 25%",
    body: "Invite friends, earn commission on every order they place. Real cash, real rewards.",
    cta: "JOIN FREE →",
    gradient: ["#422006", "#b45309", "#78350f"],
    accent: "#fbbf24",
  },
];

/* ─── Canvas drawing ─── */
const CARD_W = 1080;
const CARD_H = 1920;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const lines = text.split("\n");
  let currentY = y;
  for (const line of lines) {
    const words = line.split(" ");
    let currentLine = "";
    for (const word of words) {
      const test = currentLine + word + " ";
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        ctx.fillText(currentLine.trim(), x, currentY);
        currentLine = word + " ";
        currentY += lineHeight;
      } else {
        currentLine = test;
      }
    }
    ctx.fillText(currentLine.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

async function drawPromoCard(
  canvas: HTMLCanvasElement,
  template: (typeof TEMPLATES)[number],
  referralLink: string,
  referralCode: string,
  qrDataUrl: string | null
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = CARD_W;
  canvas.height = CARD_H;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, template.gradient[0]);
  grad.addColorStop(0.5, template.gradient[1]);
  grad.addColorStop(1, template.gradient[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Decorative circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = template.accent;
  ctx.beginPath();
  ctx.arc(CARD_W - 80, 200, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(100, CARD_H - 400, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Top bar
  const topY = 100;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(ctx, 60, topY, CARD_W - 120, 60, 30);
  ctx.fill();
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.textAlign = "center";
  ctx.fillText("GREENHUB 420  ·  UK PREMIUM FLOWER", CARD_W / 2, topY + 40);

  // Headline
  ctx.textAlign = "left";
  ctx.font = "900 96px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  const headlineY = wrapText(ctx, template.headline, 80, 340, CARD_W - 160, 110);

  // Body text
  ctx.font = "400 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  const bodyY = wrapText(ctx, template.body, 80, headlineY + 40, CARD_W - 160, 52);

  // CTA button
  const ctaY = bodyY + 60;
  ctx.fillStyle = template.accent;
  roundRect(ctx, 80, ctaY, 400, 80, 40);
  ctx.fill();
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(template.cta, 280, ctaY + 52);
  ctx.textAlign = "left";

  // Feature badges
  const badgeY = ctaY + 130;
  const badges = ["🚚 UK-Wide Delivery", "📦 Discreet Packaging", "🔒 InPost Lockers"];
  ctx.font = "500 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  badges.forEach((badge, i) => {
    const bx = 80;
    const by = badgeY + i * 65;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, bx, by, CARD_W - 160, 55, 28);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(badge, bx + 20, by + 38);
  });

  // Bottom section: QR + referral info
  const bottomY = CARD_H - 480;

  // Separator line
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, bottomY);
  ctx.lineTo(CARD_W - 80, bottomY);
  ctx.stroke();

  // "Scan to shop" label
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = template.accent;
  ctx.fillText("SCAN TO SHOP", 80, bottomY + 55);

  // QR code
  if (qrDataUrl) {
    try {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject();
        qrImg.src = qrDataUrl;
      });

      // White background for QR
      const qrSize = 260;
      const qrX = 80;
      const qrY = bottomY + 80;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, qrX, qrY, qrSize + 40, qrSize + 40, 24);
      ctx.fill();
      ctx.drawImage(qrImg, qrX + 20, qrY + 20, qrSize, qrSize);

      // Link text next to QR
      const infoX = qrX + qrSize + 80;
      ctx.font = "500 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("Your invite link:", infoX, qrY + 40);

      ctx.font = "600 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      // Wrap long URL
      const shortLink = referralLink.replace(/^https?:\/\//, "");
      wrapText(ctx, shortLink, infoX, qrY + 80, CARD_W - infoX - 80, 36);

      ctx.font = "500 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("Referral code:", infoX, qrY + 190);
      ctx.font = "bold 44px 'Courier New', monospace";
      ctx.fillStyle = template.accent;
      ctx.fillText(referralCode, infoX, qrY + 240);
    } catch {
      // QR failed, just show text
      ctx.font = "600 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(referralLink, 80, bottomY + 100);
    }
  }

  // Footer
  ctx.font = "400 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.textAlign = "center";
  ctx.fillText("greenhub420.co.uk  ·  Premium UK Cannabis", CARD_W / 2, CARD_H - 60);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ─── Component ─── */

interface PromoCardGeneratorProps {
  referralLink: string;
  referralCode: string;
}

export function PromoCardGenerator({ referralLink, referralCode }: PromoCardGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR code data URL using a hidden canvas
  const getQrDataUrl = useCallback((): string | null => {
    // Find the QR canvas in the page (from the existing QR code component)
    const existingQr = document.querySelector(".qr-for-promo canvas") as HTMLCanvasElement | null;
    if (existingQr) return existingQr.toDataURL("image/png");

    // Fallback: look for any QR canvas on the page
    const allCanvases = document.querySelectorAll("canvas");
    for (const c of allCanvases) {
      if (c.width >= 100 && c.width <= 300 && c.height === c.width) {
        return c.toDataURL("image/png");
      }
    }
    return null;
  }, []);

  const generate = useCallback(async () => {
    if (!canvasRef.current) return;
    setGenerating(true);
    try {
      const qrData = getQrDataUrl();
      await drawPromoCard(
        canvasRef.current,
        TEMPLATES[selectedTemplate],
        referralLink,
        referralCode,
        qrData
      );
      setPreviewUrl(canvasRef.current.toDataURL("image/png"));
    } catch (e) {
      console.error("Failed to generate promo card:", e);
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate, referralLink, referralCode, getQrDataUrl]);

  // Auto-generate on template change
  useEffect(() => {
    if (referralLink) {
      const timer = setTimeout(generate, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTemplate, referralLink, generate]);

  const handleSave = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `greenhub-promo-${TEMPLATES[selectedTemplate].id}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!previewUrl || !canvasRef.current) return;

    try {
      const blob = await new Promise<Blob | null>((r) =>
        canvasRef.current!.toBlob(r, "image/png")
      );
      if (!blob) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "greenhub-promo.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "GreenHub 420",
            text: TEMPLATES[selectedTemplate].body + "\n\n" + referralLink,
          });
          return;
        }
      }
      // Fallback: download
      handleSave();
    } catch {
      handleSave();
    }
  };

  const handleCopyCaption = async () => {
    const t = TEMPLATES[selectedTemplate];
    const caption = `${t.headline.replace(/\n/g, " ")} — ${t.body}\n\n🔗 ${referralLink}\n\n#GreenHub420 #UKCannabis`;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
        🎨 Promo Cards
      </p>
      <p className="mt-1 text-sm text-white/60">
        Generate share-ready promo images with your referral link built in.
      </p>

      {/* Template selector */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(i)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
              i === selectedTemplate
                ? "bg-white/15 text-white ring-1 ring-white/20"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <img
            src={previewUrl}
            alt="Promo card preview"
            className="w-full"
            style={{ maxHeight: 500, objectFit: "contain", background: "#000" }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={handleShare} disabled={!previewUrl || generating} className="min-h-[44px]">
          {generating ? "Generating…" : "📤 Share Image"}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSave} disabled={!previewUrl} className="min-h-[44px]">
          ⬇️ Save Image
        </Button>
        <Button size="sm" variant="secondary" onClick={handleCopyCaption} className="min-h-[44px]">
          {copied ? "✓ Copied!" : "📝 Copy Caption"}
        </Button>
      </div>

      {/* Caption preview */}
      <div className="mt-3 rounded-xl bg-white/5 p-3">
        <p className="text-xs text-white/40 mb-1">Caption for social media:</p>
        <p className="text-sm text-white/70 leading-relaxed">
          {TEMPLATES[selectedTemplate].headline.replace(/\n/g, " ")} — {TEMPLATES[selectedTemplate].body}
        </p>
        <p className="mt-1 text-sm text-emerald-400/80">🔗 {referralLink}</p>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
