'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Send, X, Loader, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface VoiceAssistantProps {
  isOpen: boolean
  onClose: () => void
}

export function VoiceAssistant({ isOpen, onClose }: VoiceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your Chase banking assistant. I can help you with transfers, balance inquiries, bill pay, and more. What would you like to do today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onstart = () => setIsListening(true)
        recognitionRef.current.onend = () => setIsListening(false)

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
          setInputValue(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          toast.error('Failed to recognize speech')
          setIsListening(false)
        }
      }
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const speakMessage = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported')
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const processMessage = async (text: string) => {
    if (!text.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsProcessing(true)

    try {
      // Simulate AI response - in production, this would call your backend
      await new Promise((resolve) => setTimeout(resolve, 1500))

      let assistantResponse = ''

      // Simple intent recognition
      const lowerText = text.toLowerCase()

      if (lowerText.includes('balance') || lowerText.includes('how much')) {
        assistantResponse =
          "Your current balance is $5,234.56. This includes all your checking and savings accounts. Would you like more details about a specific account?"
      } else if (lowerText.includes('transfer') || lowerText.includes('send')) {
        assistantResponse =
          "I can help you transfer money. Who would you like to send money to, and how much? You can say something like 'transfer $500 to John'"
      } else if (lowerText.includes('bill') || lowerText.includes('pay')) {
        assistantResponse =
          "I can help you pay bills. Which bill would you like to pay? You can say the company name like 'pay my electric bill' or 'pay my credit card'"
      } else if (lowerText.includes('recent') || lowerText.includes('transaction')) {
        assistantResponse =
          "Your recent transactions include: $45.32 at Starbucks, $125.00 at Target, and $60 at Shell Gas Station. Would you like details about a specific transaction?"
      } else if (lowerText.includes('card') || lowerText.includes('credit')) {
        assistantResponse =
          "I can help you manage your cards. You can lock or unlock your card, request a replacement, or set spending limits. What would you like to do?"
      } else if (lowerText.includes('help') || lowerText.includes('what can')) {
        assistantResponse =
          "I can help you with: checking balances, making transfers, paying bills, viewing transactions, managing cards, and more. Just ask me anything about your banking!"
      } else {
        assistantResponse =
          "I understand you want to " +
          text.toLowerCase() +
          '. Please provide more details so I can better assist you.'
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Automatically speak the response
      speakMessage(assistantResponse)
    } catch (error) {
      console.error('Error processing message:', error)
      toast.error('Failed to process your message')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isProcessing) {
      processMessage(inputValue)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 right-0 w-full h-full bg-black/50 z-50 md:w-96 md:h-[600px] md:rounded-t-2xl md:bottom-0 md:right-0 md:bg-transparent">
      <div className="bg-card h-full rounded-t-3xl md:rounded-2xl flex flex-col border border-border shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-3xl md:rounded-t-2xl">
          <div>
            <h2 className="font-bold text-foreground">Voice Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {isListening ? 'Listening...' : 'Ready to help'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-secondary text-foreground rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.type === 'user' 
                    ? 'text-white/70' 
                    : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-secondary text-foreground rounded-2xl rounded-bl-none px-4 py-3">
                <Loader className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-border space-y-3">
          {isListening && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              🎤 Listening... Speak now
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type or speak..."
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isProcessing}
              className={`p-2 rounded-lg transition ${
                isListening
                  ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              } disabled:opacity-50`}
            >
              <Mic className="w-5 h-5" />
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={() => window.speechSynthesis?.cancel()}
                disabled={isProcessing}
                className="p-2 bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg transition disabled:opacity-50"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={isProcessing || !inputValue.trim()}
              className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Try: "What's my balance?" or "Transfer money"
          </p>
        </div>
      </div>
    </div>
  )
}
