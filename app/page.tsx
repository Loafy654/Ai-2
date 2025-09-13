"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Send, Settings } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatApp() {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !apiKey.trim()) {
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please check your API key and try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OpenRouter Chat</h1>
          <p className="text-gray-600">Chat with DeepSeek R1 using your OpenRouter API key</p>
        </div>

        {showSettings && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                Hide
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">OpenRouter API Key</Label>
                  <div className="relative mt-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your OpenRouter API key"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Get your API key from{" "}
                    <a
                      href="https://openrouter.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      openrouter.ai
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Chat with DeepSeek R1</CardTitle>
            <div className="flex gap-2">
              {!showSettings && (
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearChat} disabled={messages.length === 0}>
                Clear Chat
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">Welcome to OpenRouter Chat!</p>
                    <p>Enter your API key above and start chatting with DeepSeek R1</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-gray-500 text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <Separator />
          <CardFooter className="p-4">
            <form onSubmit={sendMessage} className="flex w-full space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={apiKey ? "Type your message..." : "Please enter your API key first"}
                disabled={!apiKey || isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || !apiKey || isLoading} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
