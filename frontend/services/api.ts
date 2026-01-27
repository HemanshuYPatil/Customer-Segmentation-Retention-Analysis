export type HealthResponse = { status: string };

export type PredictRequest = {
  customer_id?: number;
  features?: {
    recency_days: number;
    frequency: number;
    monetary: number;
    avg_basket_value: number;
    unique_products: number;
    avg_interpurchase_days: number;
    purchase_span_days: number;
  };
};

export type PredictResponse = {
  customer_id?: number | null;
  segment: number;
  churn_probability: number;
  ltv_estimate: number;
  recommended_action: string;
};

export type SegmentSummary = {
  segment: number;
  customers: number;
  avg_recency: number;
  avg_frequency: number;
  avg_monetary: number;
  churn_rate: number;
  avg_future_spend: number;
  recommended_action: string;
};

export type Metrics = Record<string, number>;

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthResponse>("/health"),
  predict: (payload: PredictRequest) =>
    request<PredictResponse>("/predict", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  metrics: () => request<Metrics>("/metrics"),
  segments: () => request<SegmentSummary[]>("/segments"),
  retrain: () =>
    request<{ status: string }>("/retrain", {
      method: "POST"
    })
};
