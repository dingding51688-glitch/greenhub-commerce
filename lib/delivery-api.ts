/**
 * Delivery location APIs
 * - InPost UK (mainland GB): api-uk-points.easypack24.net
 * - OOHPod Locker (NI): stockist.co
 * - Yodel Store (NI): yodel.co.uk
 */

export type DeliveryLocation = {
  id: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  lat: number;
  lng: number;
  distance?: number; // metres
  type: "inpost_locker" | "oohpod_locker" | "yodel_store";
  opening: string;
  extra?: Record<string, unknown>;
};

// ─── InPost UK ──────────────────────────────────────────
/**
 * Normalize UK postcode: ensure space before last 3 chars.
 * e.g. "SW1A1AA" → "SW1A 1AA", "BT11AA" → "BT1 1AA"
 */
function normalizePostcode(raw: string): string {
  const pc = raw.replace(/\s+/g, "").toUpperCase();
  if (pc.length >= 5) {
    return pc.slice(0, -3) + " " + pc.slice(-3);
  }
  return pc;
}

/**
 * Parse InPost opening_hours string.
 * "24/7" → "24/7"
 * "MON|06:30-22:00|-;TUE|06:30-22:00|-;..." → "06:30–22:00"
 * If all days have the same hours, show once. Otherwise show "varies".
 */
function parseInPostHours(raw?: string): string {
  if (!raw) return "24/7";
  if (raw === "24/7") return "24/7";
  // Parse pipe-delimited format
  const parts = raw.split(";").filter(Boolean);
  const hours = new Set<string>();
  for (const part of parts) {
    const segs = part.split("|");
    if (segs.length >= 2 && segs[1] && segs[1] !== "-") {
      hours.add(segs[1]);
    }
  }
  if (hours.size === 0) return "24/7";
  if (hours.size === 1) {
    const h = [...hours][0];
    return h.replace("-", "–");
  }
  return "See store hours";
}

export async function searchInPostLockers(
  postcode: string,
  maxDistance = 5000,
  limit = 10
): Promise<DeliveryLocation[]> {
  const pc = normalizePostcode(postcode).replace(/ /g, "+");
  const url = `https://api-uk-points.easypack24.net/v1/points?relative_post_code=${pc}&max_distance=${maxDistance}&per_page=${limit}&type=parcel_locker&sort_by=distance_from_relative_point`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map((p: any) => {
    const street = p.address_details?.street || "";
    const buildNum = p.address_details?.building_number || "";
    const city = p.address_details?.city || "";
    const pc = p.address_details?.post_code || "";
    // Build a readable address: "Sharrow Lane, Sheffield S11 8AN"
    const addrParts = [street, city, pc].filter(Boolean);
    return {
      id: p.name,
      name: p.address?.line1 || p.name,
      address: addrParts.join(", ") || p.address?.line2 || "",
      postcode: pc,
      city,
      lat: p.location?.latitude || 0,
      lng: p.location?.longitude || 0,
      distance: p.distance ?? null,
      type: "inpost_locker" as const,
      opening: parseInPostHours(p.opening_hours),
    };
  });
}

// ─── OOHPod (Stockist) ─────────────────────────────────
let oohpodCache: DeliveryLocation[] | null = null;

async function loadAllOOHPod(): Promise<DeliveryLocation[]> {
  if (oohpodCache) return oohpodCache;
  const res = await fetch("https://stockist.co/api/v1/u9611/locations/all");
  if (!res.ok) return [];
  const data: any[] = await res.json();
  oohpodCache = data
    .filter((l) => (l.postal_code || "").toUpperCase().startsWith("BT"))
    .map((l) => ({
      id: `ooh-${l.id}`,
      name: l.name || "",
      address: [l.address_line_1, l.address_line_2].filter(Boolean).join(", "),
      postcode: l.postal_code || "",
      city: l.city || "",
      lat: parseFloat(l.latitude) || 0,
      lng: parseFloat(l.longitude) || 0,
      type: "oohpod_locker" as const,
      opening: l.filters?.some((f: any) => f.name === "24/7 Access") ? "24/7" : "Store hours",
    }));
  return oohpodCache;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchOOHPodLockers(
  lat: number,
  lng: number,
  limit = 10
): Promise<DeliveryLocation[]> {
  const all = await loadAllOOHPod();
  return all
    .map((l) => ({ ...l, distance: Math.round(haversineKm(lat, lng, l.lat, l.lng) * 1000) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

// ─── Yodel Stores ───────────────────────────────────────
export async function searchYodelStores(
  lat: number,
  lng: number,
  limit = 10
): Promise<DeliveryLocation[]> {
  const url = `https://www.yodel.co.uk/api/v2/stores.json?center_lat=${lat.toFixed(5)}&center_lng=${lng.toFixed(5)}&origin_lat=${lat.toFixed(5)}&origin_lng=${lng.toFixed(5)}&search_result_type=${encodeURIComponent("[]")}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: any[] = await res.json();
  return data
    .filter((s) => s.store_type === "PaypointStore" && (s.postcode || "").toUpperCase().startsWith("BT"))
    .slice(0, limit)
    .map((s) => ({
      id: `yodel-${s.id}`,
      name: s.name || "",
      address: [s.address, s.city, s.county].filter(Boolean).join(", "),
      postcode: s.postcode || "",
      city: s.city || "",
      lat: parseFloat(s.lat) || 0,
      lng: parseFloat(s.lng) || 0,
      distance: s.distance ? Math.round(s.distance * 1609) : undefined, // miles → metres
      type: "yodel_store" as const,
      opening: "Store hours",
    }));
}

// ─── Geocode postcode ───────────────────────────────────
export async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const pc = normalizePostcode(postcode).replace(/ /g, "+");
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude, lng: data.result.longitude };
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Helper: is Northern Ireland ────────────────────────
export function isNorthernIreland(postcode: string): boolean {
  return postcode.trim().toUpperCase().startsWith("BT");
}

export const DELIVERY_FEE = 5;
export const NI_DELIVERY_FEE = 5; // alias for backward compat
