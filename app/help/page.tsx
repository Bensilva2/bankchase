'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, Search, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function HelpPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { faqs = [], supportTickets = [] } = useBanking()
  const [currentView, setCurrentView] = useState<'main' | 'faqs' | 'chat' | 'tickets'>('main')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([])
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'bot'; content: string }[]>([
    { from: 'bot', content: 'Hello! I\'m Chase Virtual Assistant. How can I help you today?' },
  ])
  const [chatInput, setChatInput] = useState('')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    setChatMessages([...chatMessages, { from: 'user', content: chatInput }])
    setChatInput('')

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { from: 'bot', content: 'Thank you for your question. Our team will review and get back to you shortly.' },
      ])
    }, 1000)
  }

  const mockFaqs = [
    {
      id: '1',
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking "Forgot Password" on the login page and following the instructions sent to your email.',
    },
    {
      id: '2',
      question: 'How can I enable two-factor authentication?',
      answer: 'Go to Settings > Security to enable two-factor authentication using your phone number or authentication app.',
    },
    {
      id: '3',
      question: 'What are the account transfer limits?',
      answer: 'Transfer limits vary by account type. Daily transfer limit for most accounts is $10,000.',
    },
    {
      id: '4',
      question: 'How do I report a fraudulent transaction?',
      answer: 'Contact us immediately through Messages or call 1-800-935-9935 to report any fraudulent activity.',
    },
    {
      id: '5',
      question: 'How do I link an external bank account?',
      answer: 'Go to Settings > External Accounts and follow the verification process with your external bank credentials.',
    },
  ]

  const filteredFaqs = mockFaqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFaq = (id: string) => {
    setExpandedFaqs((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-gray-600">Get assistance and find answers</p>
          </div>
        </div>

        {currentView === 'main' ? (
          // Main View
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card
              onClick={() => setCurrentView('faqs')}
              className="p-8 cursor-pointer hover:shadow-lg transition bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200"
            >
              <HelpCircle className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">FAQs</h2>
              <p className="text-gray-600 mb-4">Find answers to common questions</p>
              <button className="text-blue-600 font-medium hover:text-blue-700">Browse FAQs →</button>
            </Card>

            <Card
              onClick={() => setCurrentView('chat')}
              className="p-8 cursor-pointer hover:shadow-lg transition bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200"
            >
              <MessageCircle className="w-12 h-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Chat</h2>
              <p className="text-gray-600 mb-4">Chat with our support team</p>
              <button className="text-green-600 font-medium hover:text-green-700">Start Chat →</button>
            </Card>

            <Card
              onClick={() => setCurrentView('tickets')}
              className="p-8 cursor-pointer hover:shadow-lg transition bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200"
            >
              <Mail className="w-12 h-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Tickets</h2>
              <p className="text-gray-600 mb-4">View and manage your support tickets</p>
              <button className="text-purple-600 font-medium hover:text-purple-700">View Tickets →</button>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
              <Phone className="w-12 h-12 text-yellow-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Call Us</h2>
              <p className="text-gray-600 mb-4">1-800-935-9935</p>
              <p className="text-gray-600 text-sm">Available 24/7</p>
            </Card>
          </div>
        ) : currentView === 'faqs' ? (
          // FAQs View
          <>
            <Card className="p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </Card>

            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <Card key={faq.id} className="p-0 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition text-left"
                  >
                    <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 transition ${
                        expandedFaqs.includes(faq.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedFaqs.includes(faq.id) && (
                    <div className="px-6 pb-6 bg-gray-50 border-t">
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <button
              onClick={() => setCurrentView('main')}
              className="mt-6 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back
            </button>
          </>
        ) : currentView === 'chat' ? (
          // Chat View
          <>
            <Card className="h-96 flex flex-col mb-6">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.from === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t p-4 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Send
                </button>
              </div>
            </Card>

            <button
              onClick={() => setCurrentView('main')}
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back
            </button>
          </>
        ) : (
          // Tickets View
          <>
            <div className="space-y-4">
              {supportTickets && supportTickets.length > 0 ? (
                supportTickets.map((ticket: any) => (
                  <Card key={ticket.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        ticket.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : ticket.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">Ticket #: {ticket.id}</p>
                    <p className="text-gray-600 text-sm mt-2">{ticket.message}</p>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No support tickets yet</p>
                </Card>
              )}
            </div>

            <button
              onClick={() => setCurrentView('main')}
              className="mt-6 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
