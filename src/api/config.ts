/**
 * API konfiguratsiyasi.
 *
 * Vercel (production):  VITE_API_URL=https://renessans-bekend.onrender.com
 * Lokal (dev):         VITE_API_URL ni o'rnatmang — Vite proxy /api → localhost:5000
 */
const rawBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

/** Backend origin (trailing slash yo'q). */
export const API_ORIGIN = rawBase.replace(/\/$/, '');

/**
 * Barcha API so'rovlari shu manzilga yuboriladi.
 * Dev (proxy):        /api/...
 * Production:         https://renessans-bekend.onrender.com/api/...
 */
export const BASE_URL = `${API_ORIGIN}/api`;

