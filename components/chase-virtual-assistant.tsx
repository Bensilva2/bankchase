"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Send, MessageCircle, X, Minimize2, Maximize2, Paperclip } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
}

export function ChaseVirtualAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Chase Virtual Assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const responses: Record<string, string> = {
    balance: "Your current total balance across all accounts is $45,230.50",
    transfer: "I can help you with transfers. To transfer funds, please use the Transfer option in your app.",
    payment: "For bill payments, visit the Pay Bills section. You can schedule payments or pay immediately.",
    card: "I can help with card-related inquiries. What would you like to know about your cards?",
    rewards: "You have 287,450 Ultimate Rewards Points. You can redeem them for cash, travel, or shopping.",
    security: "For security questions, visit Settings > Security. We recommend enabling biometric login.",
    accounts: "You have 4 accounts: Total Checking, Savings Plus, Money Market, and Credit Card.",
    deposit: "To deposit checks, use Mobile Check Deposit. Simply take a photo of the front and back.",
    help: "I can assist with: Account Balance, Transfers, Bill Payments, Cards, Rewards, Security, and more.",
    default:
      "I appreciate your question! For more detailed assistance, please contact our support team or visit our help center.",
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = inputValue
    setInputValue("")
    setIsLoading(true)

    // Simulate API delay
    setTimeout(() => {
      const lowerInput = userInput.toLowerCase()
      let response = responses.default

      if (lowerInput.includes("balance") || lowerInput.includes("how much")) {
        response = responses.balance
      } else if (lowerInput.includes("transfer")) {
        response = responses.transfer
      } else if (lowerInput.includes("payment") || lowerInput.includes("bill")) {
        response = responses.payment
      } else if (lowerInput.includes("card")) {
        response = responses.card
      } else if (lowerInput.includes("reward") || lowerInput.includes("point")) {
        response = responses.rewards
      } else if (lowerInput.includes("security") || lowerInput.includes("password")) {
        response = responses.security
      } else if (lowerInput.includes("account")) {
        response = responses.accounts
      } else if (lowerInput.includes("deposit") || lowerInput.includes("check")) {
        response = responses.deposit
      } else if (lowerInput.includes("help") || lowerInput.includes("what can")) {
        response = responses.help
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 800)
  }

  const handleQuickAction = (action: string) => {
    setInputValue(action)
    setTimeout(() => {
      const event = new KeyboardEvent("keydown", { key: "Enter" })
      handleSendMessage()
    }, 100)
  }

  const quickQuestions = [
    "What's my account balance?",
    "How do I transfer money?",
    "How do I pay a bill?",
    "Tell me about my rewards",
  ]

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#0a4fa6] text-white shadow-2xl hover:bg-[#083d85] transition-all duration-300 flex items-center justify-center group"
          aria-label="Open Chase Virtual Assistant"
        >
          <div className="absolute inset-0 rounded-full bg-[#0a4fa6] animate-pulse opacity-20"></div>
          <MessageCircle className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className={`fixed right-0 bottom-0 w-full max-w-md rounded-t-2xl border-l border-t border-gray-200 shadow-2xl transition-all duration-300 ${isMinimized ? "h-16" : "h-[600px]"}`}>
          <DrawerHeader className="bg-gradient-to-r from-[#0a4fa6] to-[#117aca] text-white rounded-t-2xl py-4 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative">
                <Image src="/images/chase-logo.png" alt="Chase" fill className="object-contain" />
              </div>
              <div>
                <DrawerTitle className="text-white">Chase Assistant</DrawerTitle>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          {!isMinimized && (
            <div className="flex flex-col h-full overflow-hidden bg-white">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Start a conversation</p>
                    <p className="text-xs text-gray-400 mt-1">Ask me anything about your account</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender === "user"
                            ? "bg-[#0a4fa6] text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${message.sender === "user" ? "text-white/70" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="px-4 py-3 border-t border-gray-200 space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Quick questions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(q)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#0a4fa6]">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Ask me anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 rounded-lg border-gray-300 focus:border-[#0a4fa6]"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-[#0a4fa6] hover:bg-[#083d85] text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Chase Virtual Assistant • Powered by AI
                </p>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
