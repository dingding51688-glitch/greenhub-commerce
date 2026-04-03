const REFERRAL_CODE_KEY = "referralCode";
const REFERRAL_CLICK_KEY = "referralClick";
const CLICK_DEDUP_HOURS = 24;
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function safeWindow() {
  return typeof window !== "undefined" ? window : null;
}

export function getStoredReferralCode() {
  const win = safeWindow();
  if (!win) return null;
  return win.localStorage.getItem(REFERRAL_CODE_KEY) || null;
}

export function setStoredReferralCode(code: string) {
  const win = safeWindow();
  if (!win) return;
  try {
    win.localStorage.setItem(REFERRAL_CODE_KEY, code);
  } catch {}
  try {
    document.cookie = `${REFERRAL_CODE_KEY}=${code}; path=/; max-age=${REFERRAL_COOKIE_MAX_AGE}; sameSite=Lax`;
  } catch {}
}

export function clearStoredReferralCode() {
  const win = safeWindow();
  if (!win) return;
  try {
    win.localStorage.removeItem(REFERRAL_CODE_KEY);
    win.localStorage.removeItem(`${REFERRAL_CLICK_KEY}:last`);
  } catch {}
  try {
    document.cookie = `${REFERRAL_CODE_KEY}=; path=/; max-age=0; sameSite=Lax`;
  } catch {}
}

export function shouldTrackClick(code: string) {
  const win = safeWindow();
  if (!win) return false;
  try {
    const key = `${REFERRAL_CLICK_KEY}:${code}`;
    const last = win.localStorage.getItem(key);
    if (!last) return true;
    const lastDate = Number(last);
    return Number.isNaN(lastDate) || Date.now() - lastDate > CLICK_DEDUP_HOURS * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export function markClickTracked(code: string) {
  const win = safeWindow();
  if (!win) return;
  try {
    win.localStorage.setItem(`${REFERRAL_CLICK_KEY}:${code}`, Date.now().toString());
    win.localStorage.setItem(`${REFERRAL_CLICK_KEY}:last`, Date.now().toString());
  } catch {}
}

export function getLastTrackedClickTime() {
  const win = safeWindow();
  if (!win) return null;
  const value = win.localStorage.getItem(`${REFERRAL_CLICK_KEY}:last`);
  return value ? Number(value) : null;
}

export { REFERRAL_CODE_KEY, REFERRAL_CLICK_KEY };

export function markClickError() {
  const win = safeWindow();
  if (!win) return;
  try {
    win.localStorage.setItem(`${REFERRAL_CLICK_KEY}:error`, Date.now().toString());
  } catch {}
}

export function consumeClickError() {
  const win = safeWindow();
  if (!win) return null;
  try {
    const value = win.localStorage.getItem(`${REFERRAL_CLICK_KEY}:error`);
    if (value) {
      win.localStorage.removeItem(`${REFERRAL_CLICK_KEY}:error`);
      return Number(value);
    }
  } catch {}
  return null;
}
