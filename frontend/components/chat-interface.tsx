"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, MessageCircle, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface ChatResponse {
  response?: string
  message?: string
  error?: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Sample questions in Bengali
  const sampleQuestions = [
    {
      bengali: "রবীন্দ্রনাথ ঠাকুরের জন্ম কোথায়?",
      english: "Where was Rabindranath Tagore born?",
    },
    {
      bengali: "বিহারী-বিনোদিনী রবীন্দ্রনাথের কোন উপন্যাসের চরিত্র?",
      english: "Which novel features the characters Bihari and Binodini?",
    },
    {
      bengali: "বাংলা সাহিত্যের আধুনিক যুগের সূচনা কবে?",
      english: "When did the modern era of Bengali literature begin?",
    },
    {
      bengali: "কাজী নজরুল ইসলামের বিদ্রোহী কবিতা কবে রচিত?",
      english: "When was Kazi Nazrul Islam's 'Bidrohi' poem written?",
    },
  ]

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.answer || data.response || data.message || "No response received",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
      console.error("Chat error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handleSampleQuestion = (question: string) => {
    sendMessage(question)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
          <MessageCircle className="w-8 h-8 text-primary" />
          Chat Interface
        </h2>
        <p className="text-xl text-muted-foreground">Ask questions in Bengali about literature, history, and culture</p>
        <p className="text-base text-muted-foreground/80">বাংলা সাহিত্য, ইতিহাস ও সংস্কৃতি সম্পর্কে প্রশ্ন করুন</p>
      </div>

      {/* Sample Questions */}
      {messages.length === 0 && (
        <Card className="bg-card/50 border-2 border-dashed border-primary/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              Sample Questions / নমুনা প্রশ্ন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {sampleQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start hover:bg-primary/5 hover:border-primary/30 bg-card/30 border-border/50 transition-all duration-200"
                  onClick={() => handleSampleQuestion(question.bengali)}
                >
                  <div className="space-y-2 w-full">
                    <div className="font-medium text-foreground text-base">{question.bengali}</div>
                    <div className="text-sm text-muted-foreground">{question.english}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="h-[500px] bg-card/50 border-border/50 backdrop-blur-sm">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "bot" && (
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-xl p-4 shadow-sm ${
                      message.type === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                  {message.type === "user" && (
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your question in Bengali... / বাংলায় আপনার প্রশ্ন লিখুন..."
            className="flex-1 h-12 text-base bg-input/50 border-border/50"
            disabled={isLoading}
          />
          <Button type="submit" size="lg" disabled={!inputMessage.trim() || isLoading} className="px-8 h-12">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <strong>Error:</strong> {error}
          </div>
        )}
      </form>

      {/* API Info */}
      <div className="text-center">
        <Badge variant="outline" className="text-sm px-4 py-2 bg-card/30 border-border/50">
          <MessageCircle className="w-4 h-4 mr-2" />
          POST /chat endpoint - 127.0.0.1:8000
        </Badge>
      </div>
    </div>
  )
}
