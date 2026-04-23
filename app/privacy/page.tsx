import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Chase Bank',
  description: 'Learn how Chase protects your privacy and handles your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#117aca] hover:underline mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Privacy Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              Chase Bank is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our banking services, including our website and mobile applications.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Name, email address, and phone number</li>
                  <li>Date of birth and Social Security Number</li>
                  <li>Physical address and employment information</li>
                  <li>Account and transaction information</li>
                  <li>Financial account information from other institutions</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Device Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>IP address and browser type</li>
                  <li>Device identifier and operating system</li>
                  <li>Location data (with permission)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide and maintain banking services</li>
              <li>Process transactions and send related information</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Detect, prevent, and address fraud and security issues</li>
              <li>Comply with legal obligations</li>
              <li>Improve our services and develop new products</li>
              <li>Personalize your banking experience</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Share Information</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Service providers who assist us in operating our website and conducting business</li>
              <li>Law enforcement when required by law</li>
              <li>Other financial institutions as necessary</li>
              <li>Credit bureaus for credit reporting purposes</li>
              <li>Companies you authorize to access your information</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement comprehensive security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
              <li>256-bit SSL encryption for data in transit</li>
              <li>Multi-factor authentication</li>
              <li>Regular security audits and updates</li>
              <li>Secure data centers with physical access controls</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Privacy Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your information in portable format</li>
              <li>Lodge a complaint with regulatory authorities</li>
            </ul>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or our privacy practices:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-700"><strong>Mail:</strong> Chase Bank, Privacy Office, PO Box 15298, Wilmington, DE 19886</p>
              <p className="text-gray-700"><strong>Email:</strong> privacy@chase.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> 1-800-935-9935</p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 border-t border-gray-200 text-sm text-gray-600">
            <p>
              This Privacy Policy is part of our <Link href="/terms" className="text-[#117aca] hover:underline">Terms of Service</Link>. 
              By using Chase Bank services, you consent to our collection and use of personal information as outlined here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
