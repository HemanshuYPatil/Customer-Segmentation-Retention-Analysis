import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  await inngest.send({
    name: "model.predict.single",
    data: payload
  });
  return NextResponse.json({ status: "queued" });
}
