import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { getApiBaseUrl } from "@/lib/api-base";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const apiBase = getApiBaseUrl();
  const queueId = payload.queue_id ?? crypto.randomUUID();
  if (payload?.customer_id) {
    const existsRes = await fetch(
      `${apiBase}/models/${payload.model_id}/customers/${payload.customer_id}/exists`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": payload.tenant_id
        }
      }
    );
    if (!existsRes.ok) {
      const text = await existsRes.text();
      return NextResponse.json({ detail: text || "Customer check failed" }, { status: existsRes.status });
    }
    const existsPayload = await existsRes.json();
    if (!existsPayload?.exists) {
      return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }
  }
  const queueRes = await fetch(`${apiBase}/queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": payload.tenant_id
    },
    body: JSON.stringify({
      queue_id: queueId,
      kind: "prediction",
      status: "queued",
      payload: { ...payload, mode: "single", queue_id: queueId }
    })
  });
  if (!queueRes.ok) {
    const text = await queueRes.text();
    return NextResponse.json({ detail: text || "Failed to persist queue job" }, { status: queueRes.status });
  }
  await inngest.send({
    name: "model.predict.single",
    data: { ...payload, queue_id: queueId }
  });
  return NextResponse.json({ status: "queued", queue_id: queueId });
}
