'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Eye, Key, Server, AlertCircle, CheckCircle } from 'lucide-react'

export function PrivacyInfoPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* End-to-End Encryption */}
        <Card className="bg-background shadow-lg border-0 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-card p-3 rounded-lg flex-shrink-0">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">End-to-End Encryption</h3>
              <p className="text-muted-foreground text-sm mt-2">
                All your sensitive data is encrypted using AES-256 encryption both in transit and at rest.
              </p>
              <Badge className="mt-3 bg-green-100 text-green-800 border-0">Active</Badge>
            </div>
          </div>
        </Card>

        {/* SSL/TLS Certificate */}
        <Card className="bg-background shadow-lg border-0 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">SSL/TLS Protection</h3>
              <p className="text-muted-foreground text-sm mt-2">
                TLS 1.3 protocol ensures secure communication between your browser and our servers.
              </p>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Certificate: Let's Encrypt (Valid)</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Minimization */}
        <Card className="bg-background shadow-lg border-0 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Data Minimization</h3>
              <p className="text-muted-foreground text-sm mt-2">
                We only collect and store data necessary for banking services. No unnecessary tracking or profiling.
              </p>
              <Badge className="mt-3 bg-green-100 text-green-800 border-0">Privacy First</Badge>
            </div>
          </div>
        </Card>

        {/* Privacy Controls */}
        <Card className="bg-background shadow-lg border-0 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 p-3 rounded-lg flex-shrink-0">
              <Key className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Privacy Controls</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Full granular control over what data is collected, shared, and how your information is used.
              </p>
              <Badge className="mt-3 bg-card text-blue-800 border-0">User Controlled</Badge>
            </div>
          </div>
        </Card>

        {/* Secure Servers */}
        <Card className="bg-background shadow-lg border-0 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-3 rounded-lg flex-shrink-0">
              <Server className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Secure Infrastructure</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Data stored on secure, PCI-DSS compliant servers with regular security audits and penetration testing.
              </p>
            </div>
          </div>
        </Card>

        {/* Compliance */}
        <Card className="bg-background shadow-lg border-0 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-teal-100 p-3 rounded-lg flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Compliance</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Compliant with GDPR, CCPA, and SOC 2 Type II standards for data protection and privacy.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Privacy Commitments */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-lg p-6">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 text-lg">Our Privacy Commitments</h3>
            <ul className="mt-4 space-y-3 text-blue-900 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>We never sell or rent your personal information to third parties</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Your financial data is always encrypted and secured</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You have full control over your data and can request deletion anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>We perform regular security audits and penetration testing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Any data breach is immediately reported to affected users</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
