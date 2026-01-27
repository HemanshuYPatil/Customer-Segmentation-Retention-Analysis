import { inngest } from "./client";

export const trainModel = inngest.createFunction(
  { id: "train-model" },
  { event: "model.train.requested" },
  async ({ event }) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${apiBase}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event.data)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Train request failed: ${text}`);
    }
    return await response.json();
  }
);

export const predictSingle = inngest.createFunction(
  { id: "predict-single" },
  { event: "model.predict.single" },
  async ({ event }) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${apiBase}/predict_job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event.data, mode: "single" })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Single prediction failed: ${text}`);
    }
    return await response.json();
  }
);

export const predictBatch = inngest.createFunction(
  { id: "predict-batch" },
  { event: "model.predict.batch" },
  async ({ event }) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${apiBase}/predict_job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event.data, mode: "batch" })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Batch prediction failed: ${text}`);
    }
    return await response.json();
  }
);

export const functions = [trainModel, predictSingle, predictBatch];
