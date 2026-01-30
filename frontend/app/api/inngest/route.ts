import { serve } from "inngest/next";
import { NextRequest } from "next/server";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

const handler = serve({ client: inngest, functions });

export const GET = handler.GET;
export const POST = handler.POST;

export async function PUT(request: NextRequest, context: any) {
  const clone = request.clone();
  const text = await clone.text();
  if (!text) {
    return new Response(null, { status: 200 });
  }
  return handler.PUT(
    new NextRequest(request.url, {
      method: "PUT",
      headers: request.headers,
      body: text
    }),
    context
  );
}
