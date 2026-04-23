'use client'

import type React from 'react'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronDown, Mail, Phone, MessageSquare } from 'lucide-react'

interface FAQ {
  id: string
  category: 'login' | 'account' | 'identification' | 'security' | 'general'
  question: string
  answer: string
  keywords: string[]
}

const FAQs: FAQ[] = [
  // Login & Identification
  {
    id: 'login-1',
    category: 'login',
    question: 'How do I log in to my account?',
    answer:
      'To log in, visit our login page and enter your username and password. You can optionally enable token-based authentication for added security. If you have multiple devices, your session will sync automatically across all your devices.',
    keywords: ['login', 'signin', 'username', 'password', 'access'],
  },
  {
    id: 'login-2',
    category: 'login',
    question: 'What is token-based authentication?',
    answer:
      'Token-based authentication is an additional security layer where a 6-digit security code is sent to your registered email. This code must be entered during login for added protection. The token expires after 60 seconds for security purposes.',
    keywords: ['token', 'security', 'authentication', 'code', 'email'],
  },
  {
    id: 'login-3',
    category: 'login',
    question: 'I forgot my username. How can I recover it?',
    answer:
      'Click "Forgot username or password?" on the login page. Select "Verify Your Identity" and provide your Social Security Number or Account Number. After verification, your username will be displayed securely.',
    keywords: ['forgot', 'username', 'recover', 'lost', 'access'],
  },
  {
    id: 'login-4',
    category: 'login',
    question: 'What do I do if I forgot my password?',
    answer:
      'Click "Forgot username or password?" on the login page. Verify your identity using your SSN or Account Number. You will receive a password reset link via email with instructions to create a new password.',
    keywords: ['forgot', 'password', 'reset', 'change', 'new'],
  },
  {
    id: 'identification-1',
    category: 'identification',
    question: 'What identification do I need to verify my identity?',
    answer:
      'You can verify your identity using either your Social Security Number (SSN) or Tax ID (TIN), or your Account, Card, or Application number. If you do not have an SSN, you can use alternative forms of identification such as a passport, driver\'s license, or ITIN.',
    keywords: ['identification', 'verify', 'ID', 'ssn', 'tax id'],
  },
  {
    id: 'identification-2',
    category: 'identification',
    question: 'I don\'t have a Social Security number. What can I do?',
    answer:
      'If you don\'t have a Social Security number, select "Don\'t have a Social Security number?" on the identification page. You can then provide alternative identification such as a valid passport, driver\'s license, or Individual Taxpayer Identification Number (ITIN). Our system will verify your information securely.',
    keywords: ['no ssn', 'alternative id', 'passport', 'license', 'itin'],
  },
  {
    id: 'identification-3',
    category: 'identification',
    question: 'I am an authorized user on someone else\'s account. How do I verify?',
    answer:
      'If you are an authorized user on another account, click "I\'m an authorized user on someone else\'s account" during identification. You will be guided through a verification process that confirms your authorized status and allows you to access account recovery options.',
    keywords: ['authorized user', 'someone else', 'account', 'access'],
  },
  {
    id: 'identification-4',
    category: 'identification',
    question: 'Is my identification information secure?',
    answer:
      'Yes. All identification information is encrypted using bank-grade security protocols and is stored securely in our database. We never display your full SSN or Account Number on screen - only you and our security team can access this information. Your verification is also logged for audit purposes.',
    keywords: ['security', 'safe', 'encrypted', 'private', 'confidential'],
  },

  // Account Management
  {
    id: 'account-1',
    category: 'account',
    question: 'How do I open a new account?',
    answer:
      'On the login dashboard, click "Open an account". Select your desired account type (Checking, Savings, or Money Market). Complete the account details form, including funding source and initial deposit. Your new account will be created immediately with a unique account number.',
    keywords: ['open', 'new account', 'create', 'checking', 'savings'],
  },
  {
    id: 'account-2',
    category: 'account',
    question: 'What account types are available?',
    answer:
      'We offer three main account types: Checking accounts for everyday transactions, Savings accounts for building your savings, and Money Market accounts for higher yield savings. Each account type has different features, interest rates, and minimum balance requirements.',
    keywords: ['account type', 'checking', 'savings', 'money market', 'types'],
  },
  {
    id: 'account-3',
    category: 'account',
    question: 'How do I check my account balance?',
    answer:
      'After logging in, your account balance is displayed in real-time on the dashboard. You can view balances for all your accounts instantly. Balances update automatically whenever transactions occur.',
    keywords: ['balance', 'check', 'view', 'amount', 'available'],
  },
  {
    id: 'account-4',
    category: 'account',
    question: 'Can I transfer money between my accounts?',
    answer:
      'Yes. Click the "Transfer" button on your dashboard to transfer funds between your Chase accounts. Select the source and destination accounts, enter the amount, and confirm. Transfers are processed in real-time.',
    keywords: ['transfer', 'move money', 'between accounts', 'internal'],
  },

  // Security
  {
    id: 'security-1',
    category: 'security',
    question: 'How is my account protected?',
    answer:
      'Your account is protected by multiple layers of security: encrypted passwords using bcrypt hashing, secure session management with HTTP-only cookies, Row Level Security (RLS) on the database, token-based authentication, and real-time fraud monitoring. We also maintain comprehensive audit logs of all account activities.',
    keywords: ['security', 'protection', 'safe', 'encrypt', 'protect'],
  },
  {
    id: 'security-2',
    category: 'security',
    question: 'Will my information be shared with third parties?',
    answer:
      'No. We never share your personal or financial information with third parties without your explicit consent, except as required by law. Your data is strictly confidential and used only for providing banking services. For detailed information, please review our Privacy Policy.',
    keywords: ['privacy', 'third party', 'share', 'confidential', 'data'],
  },
  {
    id: 'security-3',
    category: 'security',
    question: 'What should I do if I suspect fraud?',
    answer:
      'If you suspect fraudulent activity, contact us immediately through the "Contact Support" option or call our fraud team. We have real-time monitoring systems that can help identify and prevent unauthorized transactions. All suspicious activities are logged and investigated.',
    keywords: ['fraud', 'suspicious', 'unauthorized', 'report', 'alert'],
  },
  {
    id: 'security-4',
    category: 'security',
    question: 'Is my connection to Chase secure?',
    answer:
      'Yes. All connections to Chase are encrypted using industry-standard SSL/TLS protocols. Your data is transmitted securely over HTTPS. We also implement Content Security Policy (CSP) headers and other security best practices to protect against common web attacks.',
    keywords: ['https', 'encryption', 'secure connection', 'ssl', 'tls'],
  },

  // Banking Operations
  {
    id: 'general-1',
    category: 'general',
    question: 'How do I send money to someone?',
    answer:
      'Click the "Send Money" button to send funds via Zelle. Enter the recipient\'s email or phone number, the amount, and optional notes. The transfer is processed in real-time, and both you and the recipient will receive confirmation emails.',
    keywords: ['send money', 'zelle', 'transfer', 'recipient', 'payment'],
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'Can I pay my bills through Chase?',
    answer:
      'Yes. Click the "Pay Bills" option on your dashboard. Enter the biller information, amount, and payment date. Bills are processed securely and you can track payment status in real-time. Payment confirmations are sent via email.',
    keywords: ['pay bills', 'payment', 'biller', 'scheduled', 'recurring'],
  },
  {
    id: 'general-3',
    category: 'general',
    question: 'How do I deposit a check remotely?',
    answer:
      'Click the "Deposit Checks" option and follow the on-screen instructions. Take clear photos of the front and back of your check. Verify the amount and confirm the deposit. Your deposit will be processed and funds credited to your account within 1-2 business days.',
    keywords: ['deposit', 'check', 'mobile', 'remote', 'capture'],
  },
  {
    id: 'general-4',
    category: 'general',
    question: 'What is a Wire Transfer?',
    answer:
      'A Wire Transfer allows you to send money domestically or internationally directly from your bank account. Click "Wire Transfer" and select your transfer type (domestic or international). Enter recipient details and amount. Wire transfers are secure and typically complete within 24 hours.',
    keywords: ['wire transfer', 'domestic', 'international', 'send', 'money'],
  },
  {
    id: 'general-5',
    category: 'general',
    question: 'How do I access my account on multiple devices?',
    answer:
      'Your account automatically syncs across all your devices. Simply log in on any device with your username and password. Your session will persist across restarts, and all your account information and transactions will be available in real-time on every device.',
    keywords: ['devices', 'multiple devices', 'sync', 'app', 'cross-device'],
  },

  // Sign Up
  {
    id: 'general-6',
    category: 'general',
    question: 'How do I create a new Chase account?',
    answer:
      'Click "Sign up" on the login page. Complete the 3-step signup form: Step 1 - Personal information (first name, last name, email, phone), Step 2 - Security information (SSN, date of birth, address), Step 3 - Credentials (username, password). Your account will be created immediately and you can log in right away.',
    keywords: ['signup', 'register', 'create account', 'new user', 'join'],
  },
  {
    id: 'general-7',
    category: 'general',
    question: 'Do I need to activate my account after signup?',
    answer:
      'Your account is automatically activated after signup. You will receive a verification email with a security token. You can log in immediately after completing the signup process. We recommend enabling token-based authentication for additional security.',
    keywords: ['activate', 'activate account', 'verify', 'email', 'confirm'],
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = [
    { id: 'login', label: 'Login & Recovery' },
    { id: 'account', label: 'Account Management' },
    { id: 'identification', label: 'Identification' },
    { id: 'security', label: 'Security & Privacy' },
    { id: 'general', label: 'General Banking' },
  ]

  // Real-time search and filter
  const filteredFAQs = useMemo(() => {
    let results = FAQs

    // Filter by category
    if (selectedCategory) {
      results = results.filter((faq) => faq.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter((faq) => faq.question.toLowerCase().includes(query) || faq.keywords.some((keyword) => keyword.includes(query)))
    }

    return results
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#117aca] hover:underline mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="text-gray-600 mt-2">Find answers to common questions about Chase Bank services</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedCategory(null) // Reset category when searching
              }}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#117aca] transition-colors"
            />
          </div>
          {searchQuery && <p className="text-sm text-gray-500 mt-2">{filteredFAQs.length} results found</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => {
              setSelectedCategory(null)
              setSearchQuery('')
            }}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCategory === null
                ? 'bg-[#117aca] text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#117aca]'
            }`}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                setSearchQuery('')
              }}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#117aca] text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#117aca]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs List */}
        {filteredFAQs.length > 0 ? (
          <div className="space-y-3">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 text-lg">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${expandedId === faq.id ? 'transform rotate-180' : ''}`}
                  />
                </button>

                {expandedId === faq.id && (
                  <div className="px-6 pb-6 border-t border-gray-200 pt-4 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No FAQs found. Try a different search term.</p>
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Mail className="w-12 h-12 text-[#117aca] mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 text-sm mb-4">support@chase.com</p>
            <a href="mailto:support@chase.com" className="text-[#117aca] hover:underline text-sm font-medium">
              Send Email
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Phone className="w-12 h-12 text-[#117aca] mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-gray-600 text-sm mb-4">1-800-935-9935</p>
            <a href="tel:1-800-935-9935" className="text-[#117aca] hover:underline text-sm font-medium">
              Call Now
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <MessageSquare className="w-12 h-12 text-[#117aca] mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Chat Support</h3>
            <p className="text-gray-600 text-sm mb-4">Available 24/7</p>
            <button className="text-[#117aca] hover:underline text-sm font-medium">Start Chat</button>
          </div>
        </div>
      </div>
    </div>
  )
}
