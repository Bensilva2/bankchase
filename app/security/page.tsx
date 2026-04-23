import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Lock, Shield, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security Center | Chase Bank',
  description: 'Learn about Chase security features and how to protect your account.',
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#117aca] hover:underline mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600 mt-2">Protecting your account and information</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Security is Our Priority</h2>
          <p className="text-gray-700">
            Chase employs industry-leading security technology and practices to protect your accounts and personal information from fraud and unauthorized access.
          </p>
        </div>

        {/* Security Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Security Features</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#117aca]">
              <div className="flex items-start gap-4">
                <Lock className="w-6 h-6 text-[#117aca] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">SSL Encryption</h3>
                  <p className="text-gray-700">256-bit SSL encryption secures all data transmitted between your device and Chase servers.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Factor Authentication</h3>
                  <p className="text-gray-700">Requires multiple verification methods to prevent unauthorized access to your account.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
              <div className="flex items-start gap-4">
                <Eye className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Monitoring</h3>
                  <p className="text-gray-700">Continuous monitoring detects suspicious activity and alerts you immediately.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-600">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fraud Detection</h3>
                  <p className="text-gray-700">Advanced algorithms identify and block fraudulent transactions before they're processed.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Best Practices</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Use a Strong Password</h3>
                <p className="text-gray-700">Create passwords with at least 12 characters including uppercase, lowercase, numbers, and symbols.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Enable Two-Factor Authentication</h3>
                <p className="text-gray-700">Add an extra layer of security by requiring a verification code in addition to your password.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Keep Your Device Secure</h3>
                <p className="text-gray-700">Keep your operating system, browser, and security software up to date.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Don't Share Personal Information</h3>
                <p className="text-gray-700">Chase will never ask for your password, full SSN, or account PIN via email or phone.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Monitor Your Account</h3>
                <p className="text-gray-700">Regularly review your account statements and transaction history for unauthorized activity.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Use Secure Connections</h3>
                <p className="text-gray-700">Always access Chase through https://www.chase.com or the official mobile app, never through links in emails.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Fraud Liability */}
        <section className="mb-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fraud Liability Protection</h2>
          <p className="text-gray-700 mb-4">
            Chase offers comprehensive fraud protection. If fraudulent activity occurs on your account:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Report the fraud immediately to Chase</li>
            <li>You are generally not liable for unauthorized transactions if reported promptly</li>
            <li>We will investigate the claims and work to resolve the issue</li>
            <li>A replacement debit card will be issued if needed</li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700"><strong>Important:</strong> Report fraud immediately by calling 1-800-935-9935 or using the mobile app.</p>
          </div>
        </section>

        {/* Identity Protection */}
        <section className="mb-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Identity Protection Services</h2>
          <p className="text-gray-700 mb-4">
            Chase offers identity protection services to help safeguard your personal information:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Credit monitoring and alerts</li>
            <li>Identity theft detection and resolution</li>
            <li>Access to credit scores</li>
            <li>Personalized recommendations</li>
            <li>24/7 dedicated fraud specialist support</li>
          </ul>
        </section>

        {/* Report Security Issues */}
        <section className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Security Issues</h2>
          <p className="text-gray-700 mb-4">
            If you suspect unauthorized activity or want to report a security vulnerability:
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-gray-700"><strong>Fraud or Unauthorized Activity:</strong></p>
              <p className="text-gray-600 ml-4">Call: 1-800-935-9935 (24/7)</p>
            </div>
            <div>
              <p className="text-gray-700"><strong>Security Vulnerability:</strong></p>
              <p className="text-gray-600 ml-4">Email: security@chase.com</p>
            </div>
            <div>
              <p className="text-gray-700"><strong>Customer Service:</strong></p>
              <p className="text-gray-600 ml-4">Call: 1-800-935-9935 or visit <span className="text-[#117aca]">chase.com</span></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
