let memoryToken: string | null = null;
let memoryEmail: string | null = null;

export const AUTH_TOKEN_KEY = "bv:auth-token";
export const AUTH_EMAIL_KEY = "bv:auth-email";

export function getStoredToken() {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return null;
  memoryToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
  return memoryToken;
}

export function setStoredToken(token: string | null) {
  memoryToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getStoredEmail() {
  if (memoryEmail) return memoryEmail;
  if (typeof window === "undefined") return null;
  memoryEmail = window.localStorage.getItem(AUTH_EMAIL_KEY);
  return memoryEmail;
}

export function setStoredEmail(email: string | null) {
  memoryEmail = email;
  if (typeof window === "undefined") return;
  if (email) {
    window.localStorage.setItem(AUTH_EMAIL_KEY, email);
  } else {
    window.localStorage.removeItem(AUTH_EMAIL_KEY);
  }
}
