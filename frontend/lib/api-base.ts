const DEFAULT_DEV_API_BASE = "http://127.0.0.1:8000";
const DEFAULT_PROD_API_BASE = "https://csr-vx85.onrender.com";

export function getApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }
  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PROD_API_BASE;
  }
  return DEFAULT_DEV_API_BASE;
}
