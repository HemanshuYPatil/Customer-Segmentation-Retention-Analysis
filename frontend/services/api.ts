import { getApiBaseUrl } from "@/lib/api-base";

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

const baseUrl = getApiBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { auth } = await import("@/lib/firebase");
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  const tenantId = user?.uid;
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "X-Tenant-Id": tenantId } : {})
    },
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
  models: () =>
    request<Array<{ model_id: string; name: string; metrics: Metrics; artifact_prefix: string }>>("/models"),
  modelDetail: (modelId: string) =>
    request<{ model_id: string; name: string; metrics: Metrics; artifact_prefix: string; created_at?: unknown }>(
      `/models/${modelId}`
    ),
  modelJson: (modelId: string) =>
    request<{ filename: string; data: unknown }>(`/models/${modelId}/json`),
  modelDataset: (modelId: string) =>
    request<{ path: string; columns: string[]; rows: Array<Record<string, unknown>> }>(
      `/models/${modelId}/dataset`
    ),
  defaultModel: () => request<{ model_id: string | null }>("/models/default"),
  setDefaultModel: (modelId: string) =>
    request<{ status: string }>("/models/default", {
      method: "POST",
      body: JSON.stringify({ model_id: modelId })
    }),
  predictions: () => request<Array<Record<string, unknown>>>("/predictions"),
  predictionDetail: (predictionId: string) =>
    request<Record<string, unknown>>(`/predictions/${predictionId}`),
  predictionDownload: (predictionId: string) =>
    request<{ url: string }>(`/predictions/${predictionId}/download`),
  predictionCsv: async (predictionId: string) => {
    const { auth } = await import("@/lib/firebase");
    return fetch(`${baseUrl}/predictions/${predictionId}/csv`, {
      headers: {
        "Content-Type": "text/csv",
        ...(auth.currentUser?.uid ? { "X-Tenant-Id": auth.currentUser.uid } : {})
      }
    });
  },
  retrain: async (payload: { tenant_id: string; dataset_path: string; mapping_path?: string; notify_email?: string | null; model_label?: string }) => {
    const res = await fetch("/api/queue/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error("Failed to queue training");
    }
    return res.json();
  },
  uploadDataset: async (
    tenantId: string,
    file: File,
    mapping?: Record<string, string>
  ): Promise<{ dataset_path: string; mapping_path?: string }> => {
    const form = new FormData();
    form.append("tenant_id", tenantId);
    form.append("file", file);
    if (mapping) {
      form.append("mapping", JSON.stringify(mapping));
    }
    const res = await fetch(`${baseUrl}/upload`, {
      method: "POST",
      body: form
    });
    if (!res.ok) {
      throw new Error("Upload failed");
    }
    return res.json();
  },
  queueSinglePrediction: async (payload: { tenant_id: string; model_id: string; customer_id?: number; features?: PredictRequest["features"]; notify_email?: string | null }) => {
    const res = await fetch("/api/queue/predict-single", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to queue single prediction");
    }
    return res.json();
  },
  queueBatchPrediction: async (payload: { tenant_id: string; model_id: string; notify_email?: string | null }) => {
    const res = await fetch("/api/queue/predict-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error("Failed to queue batch prediction");
    }
    return res.json();
  },
  queueJobs: (kind: string, status?: string) => {
    const params = new URLSearchParams({ kind });
    if (status) params.set("status", status);
    return request<Array<Record<string, unknown>>>(`/queue?${params.toString()}`);
  },
  updateQueueJob: (queueId: string, payload: { status?: string; result?: Record<string, unknown>; error?: string }) =>
    request<{ status: string }>(`/queue/${queueId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    })
};
