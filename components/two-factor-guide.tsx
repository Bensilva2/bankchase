'use client'

import { Card } from '@/components/ui/card'
import { Shield, Smartphone, QrCode, CheckCircle } from 'lucide-react'

export function TwoFactorGuide() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">How Two-Factor Authentication Works</h1>
        <p className="text-gray-600 mt-2">Secure your account with TOTP-based two-factor authentication</p>
      </div>

      {/* Why 2FA Section */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Why Use 2FA?</h2>
            <p className="text-gray-600 mt-2">
              Two-factor authentication adds an extra layer of security to your account. Even if someone obtains your password, 
              they won't be able to access your account without the second factor (your authenticator app code).
            </p>
          </div>
        </div>
      </Card>

      {/* Setup Steps */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Setup Steps</h2>
        <div className="space-y-4">
          {/* Step 1 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Download an Authenticator App</h3>
                <p className="text-gray-600 mt-2">
                  Install one of these free authenticator apps on your phone:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Google Authenticator (Android/iOS)</li>
                  <li>Microsoft Authenticator (Android/iOS)</li>
                  <li>Authy (Android/iOS)</li>
                  <li>LastPass Authenticator (Android/iOS)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Go to Security Settings</h3>
                <p className="text-gray-600 mt-2">
                  Navigate to your account settings and find the Two-Factor Authentication section. Click "Enable TOTP 2FA" to start the setup process.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
                </div>
                <p className="text-gray-600 mt-2">
                  A QR code will be displayed. Open your authenticator app and scan this code. This links your app to your account.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 4 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Enter Verification Code</h3>
                <p className="text-gray-600 mt-2">
                  Your authenticator app will generate a 6-digit code. Enter this code to verify the setup is working correctly.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 5 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Save Backup Codes</h3>
                <p className="text-gray-600 mt-2">
                  Important: Save your backup codes in a safe place. You can use these codes if you lose access to your authenticator app.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Login Process */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Smartphone className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">During Login</h2>
            <p className="text-gray-600 mt-2">
              After entering your password, you'll be prompted to enter the 6-digit code from your authenticator app. This code changes every 30 seconds for security.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm font-semibold text-green-900 mb-2">✓ Login Flow with 2FA:</p>
              <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                <li>Enter email and password</li>
                <li>When prompted, open authenticator app</li>
                <li>Read the 6-digit code</li>
                <li>Enter code on the 2FA verification screen</li>
                <li>Complete login</li>
              </ol>
            </div>
          </div>
        </div>
      </Card>

      {/* Backup Codes Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup Codes</h2>
        <p className="text-gray-600 mb-4">
          Backup codes are one-time use codes that can be used to log in if you don't have access to your authenticator app. 
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-900 mb-2">⚠ Important:</p>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Store backup codes in a secure location (password manager recommended)</li>
            <li>• Each code can only be used once</li>
            <li>• Once codes are used, you won't be able to log in without your authenticator app</li>
            <li>• You can generate new backup codes anytime from settings</li>
          </ul>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">What if I lose my phone?</h3>
            <p className="text-gray-600 text-sm">
              Use one of your backup codes to log in. After logging in, disable 2FA and set it up again with your new device.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">What if I run out of backup codes?</h3>
            <p className="text-gray-600 text-sm">
              You can generate new backup codes anytime from your security settings. The old codes will become invalid.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Can I disable 2FA?</h3>
            <p className="text-gray-600 text-sm">
              Yes, you can disable 2FA from your settings, but we recommend keeping it enabled for better security.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Is 2FA mandatory?</h3>
            <p className="text-gray-600 text-sm">
              No, 2FA is optional. However, enabling it significantly improves your account security.
            </p>
          </div>
        </div>
      </Card>

      {/* Best Practices */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Best Practices</h2>
            <ul className="text-gray-700 mt-3 space-y-2">
              <li>• ✓ Keep your authenticator app secure</li>
              <li>• ✓ Save backup codes in a secure location</li>
              <li>• ✓ Enable 2FA on all important accounts</li>
              <li>• ✓ Keep your phone's OS and authenticator app updated</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
