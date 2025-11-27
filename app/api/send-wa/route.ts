// app/api/send-wa/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, message } = body;

  const res = await fetch("https://sby.wablas.com/api/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Cw1yUpE9eWC0gUvkZFYMWCihWemPJj07F0bQDg6wjxC0Iof643z8iNJ", // jangan lupa ganti ke env nanti
    },
    body: JSON.stringify({
      phone, // format: 628xxxx
      message,
      secret: false,
      retry: false,
      isGroup: false,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
