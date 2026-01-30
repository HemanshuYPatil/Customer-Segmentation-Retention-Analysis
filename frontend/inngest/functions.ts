import { inngest } from "./client";
import { getApiBaseUrl } from "@/lib/api-base";

export const trainModel = inngest.createFunction(
  { id: "train-model" },
  { event: "model.train.requested" },
  async ({ event }) => {
    const apiBase = getApiBaseUrl();
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
    const apiBase = getApiBaseUrl();
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
    const apiBase = getApiBaseUrl();
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

export const sendEmail = inngest.createFunction(
  { id: "send-email" },
  { event: "email.send" },
  async ({ event }) => {
    const apiUrl = process.env.BREVO_API_URL ?? "https://api.brevo.com/v3/smtp/email";
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME ?? "Customer Segmentation";
    if (!apiKey || !senderEmail) {
      throw new Error("Missing BREVO_API_KEY or BREVO_SENDER_EMAIL");
    }
    const body: Record<string, unknown> = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: event.data.to_email }],
      subject: event.data.subject,
      htmlContent: event.data.html,
      textContent: event.data.text
    };
    if (event.data?.metadata && Object.keys(event.data.metadata).length > 0) {
      body.params = event.data.metadata;
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Brevo send failed: ${text}`);
    }
    return { status: "sent" };
  }
);

export const functions = [trainModel, predictSingle, predictBatch, sendEmail];
