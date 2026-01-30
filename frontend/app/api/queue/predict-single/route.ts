import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
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
  await inngest.send({
    name: "model.predict.single",
    data: payload
  });
  return NextResponse.json({ status: "queued" });
}
