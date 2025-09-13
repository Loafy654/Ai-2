import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey } = await req.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "OpenRouter Chat App",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: messages,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenRouter API error:", errorData)
      return NextResponse.json({ error: "Failed to get response from OpenRouter API" }, { status: response.status })
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json({ error: "Invalid response format from OpenRouter API" }, { status: 500 })
    }

    return NextResponse.json({
      content: data.choices[0].message.content,
      usage: data.usage,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
