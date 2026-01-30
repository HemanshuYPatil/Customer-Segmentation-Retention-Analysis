import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  await inngest.send({
    name: "email.send",
    data: {
      to_email: payload.to_email,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      metadata: payload.metadata ?? {}
    },
    id: payload.event_id
  });
  return NextResponse.json({ status: "queued" });
}
