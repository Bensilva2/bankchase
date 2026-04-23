import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Chase Bank',
  description: 'Review the terms and conditions for using Chase Bank services.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#117aca] hover:underline mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Effective Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of Chase Bank's website, mobile applications, and banking services. By accessing or using Chase services, you agree to be bound by these Terms. If you do not agree to any part of these Terms, you may not use our services.
            </p>
          </section>

          {/* Account Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Eligibility</h2>
            <p className="text-gray-700 mb-4">To open and maintain a Chase account, you must:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Be at least 18 years old</li>
              <li>Be a citizen or permanent resident of the United States</li>
              <li>Provide accurate and complete information</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not have had a Chase account closed for cause within the last 2 years</li>
            </ul>
          </section>

          {/* Use Restrictions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Use Restrictions</h2>
            <p className="text-gray-700 mb-4">You agree not to use Chase services to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Engage in any illegal activity</li>
              <li>Violate any applicable law or regulation</li>
              <li>Transmit malware or harmful code</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Engage in any form of fraud or deception</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harass or abuse other users</li>
            </ul>
          </section>

          {/* Account Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Account Responsibilities</h2>
            <p className="text-gray-700 mb-4">You are responsible for:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>Notifying us immediately of unauthorized access</li>
              <li>All transactions made using your account</li>
              <li>Updating your personal information</li>
              <li>Complying with all applicable laws</li>
            </ul>
          </section>

          {/* Transactions and Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transactions and Transfers</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Chase will process authorized transactions submitted through our services. All transactions are subject to verification and security reviews.
              </p>
              <p>
                Wire transfers and other payment instructions must include accurate recipient information. Chase is not responsible for errors in recipient information provided by you.
              </p>
              <p>
                Some transactions may be delayed pending verification or compliance reviews. We will notify you of any delays.
              </p>
            </div>
          </section>

          {/* Fees and Charges */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Fees and Charges</h2>
            <p className="text-gray-700 mb-4">
              Chase may charge fees for certain services as described in our Fee Schedule. Fees may be adjusted with notice. You authorize Chase to debit your account for any applicable fees.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> See our Fee Schedule available on our website or by request for current fee information.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the extent permitted by law, Chase shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services, including loss of profits, data, or business opportunities.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless Chase, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, or losses arising from your use of our services or violation of these Terms.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              Any disputes arising under these Terms shall be resolved through binding arbitration except for claims relating to intellectual property rights or confidentiality.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Chase reserves the right to modify these Terms at any time. Changes will be effective upon posting to our website. Your continued use of our services constitutes acceptance of modified Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-700"><strong>Email:</strong> support@chase.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> 1-800-935-9935</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
