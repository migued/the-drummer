import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, model } = await req.json();
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return new Response("API key required", { status: 401 });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "openai/gpt-3.5-turbo",
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(error, { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
