'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Wifi, 
  WifiOff, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Lock,
  Eye,
  ArrowRight
} from 'lucide-react'

interface WiFiNetwork {
  name: string
  signal: number
  encryption: string
  riskLevel: 'safe' | 'warning' | 'danger'
  recommendation: string
}

const currentNetwork: WiFiNetwork = {
  name: 'HomeNetwork_5G',
  signal: 85,
  encryption: 'WPA3',
  riskLevel: 'safe',
  recommendation: 'Your network is secure',
}

const publicNetworks: WiFiNetwork[] = [
  {
    name: 'CoffeeShop_WiFi',
    signal: 60,
    encryption: 'None (Open)',
    riskLevel: 'danger',
    recommendation: 'Use VPN when connecting',
  },
  {
    name: 'AirportFreeWiFi',
    signal: 75,
    encryption: 'WPA2',
    riskLevel: 'warning',
    recommendation: 'VPN recommended for banking',
  },
  {
    name: 'Hotel_Guest_Network',
    signal: 80,
    encryption: 'WPA2',
    riskLevel: 'warning',
    recommendation: 'Use VPN for sensitive activities',
  },
]

function getRiskColor(risk: string) {
  switch (risk) {
    case 'safe':
      return 'bg-green-100 text-green-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'danger':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-background text-foreground'
  }
}

function getRiskIcon(risk: string) {
  switch (risk) {
    case 'safe':
      return <CheckCircle className="w-5 h-5 text-green-600" />
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />
    case 'danger':
      return <AlertCircle className="w-5 h-5 text-red-600" />
    default:
      return <Info className="w-5 h-5" />
  }
}

export default function WiFiSecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wifi className="w-8 h-8 text-[#0a4fa6]" />
            <h1 className="text-4xl font-bold text-foreground">WiFi & Network Security</h1>
          </div>
          <p className="text-muted-foreground">
            Learn how to stay secure on public WiFi networks and protect your banking information
          </p>
        </div>

        {/* Current Network Status */}
        <Card className="bg-background shadow-lg border-0 mb-8 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Current Network</h2>
              <p className="text-muted-foreground mt-1">Your current WiFi connection status</p>
            </div>
            <div className="flex items-center gap-2">
              {getRiskIcon(currentNetwork.riskLevel)}
              <Badge className={`${getRiskColor(currentNetwork.riskLevel)} border-0 text-sm`}>
                {currentNetwork.riskLevel === 'safe' ? 'Secure' : 'Warning'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Network Name</p>
              <p className="font-semibold text-foreground">{currentNetwork.name}</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Signal Strength</p>
              <p className="font-semibold text-foreground">{currentNetwork.signal}%</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Encryption</p>
              <p className="font-semibold text-foreground">{currentNetwork.encryption}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">Status</p>
              <p className="font-semibold text-green-900">{currentNetwork.recommendation}</p>
            </div>
          </div>
        </Card>

        {/* WiFi Safety Tips */}
        <Card className="bg-gradient-to-r from-background to-card border border-blue-200 shadow-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 text-lg">WiFi Safety Tips</h3>
              <ul className="mt-4 space-y-3 text-blue-900 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Avoid using public WiFi for sensitive transactions like online banking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Always enable a VPN when connecting to public networks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Verify the network name with the establishment before connecting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Disable auto-connect and manually select networks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Use two-factor authentication for extra security</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Public Network Risks */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Nearby Networks & Risk Assessment</h2>
          <div className="space-y-4">
            {publicNetworks.map((network, index) => (
              <Card key={index} className="bg-background shadow-lg border-0 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getRiskIcon(network.riskLevel)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{network.name}</h3>
                        <Badge className={`${getRiskColor(network.riskLevel)} border-0 text-xs`}>
                          {network.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Signal Strength:</span> {network.signal}%
                        </div>
                        <div>
                          <span className="font-medium">Encryption:</span> {network.encryption}
                        </div>
                      </div>
                      <p className="text-sm text-foreground mt-3 font-medium">
                        {network.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* VPN Recommendations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">VPN Recommendations</h2>
          <Card className="bg-background shadow-lg border-0 p-6">
            <div className="flex items-start gap-4 mb-6">
              <Eye className="w-6 h-6 text-[#0a4fa6] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg text-foreground">Why Use a VPN?</h3>
                <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
                  <li>• Encrypts all traffic between your device and the VPN server</li>
                  <li>• Masks your real IP address and location</li>
                  <li>• Prevents interception of sensitive data on public networks</li>
                  <li>• Protects against man-in-the-middle attacks</li>
                  <li>• Adds an extra layer of security for banking applications</li>
                </ul>
              </div>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border mt-6">
              <h4 className="font-semibold text-foreground mb-4">Recommended VPN Providers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-foreground">Proton VPN</h5>
                      <p className="text-xs text-muted-foreground mt-1">Privacy-focused VPN with strong encryption</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge className="bg-card text-blue-800 border-0 text-xs">AES-256</Badge>
                        <Badge className="bg-green-100 text-green-800 border-0 text-xs">No-Logs</Badge>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                  <Button className="w-full mt-4 bg-[#0a4fa6] hover:bg-[#003087] text-sm h-8">
                    Learn More
                  </Button>
                </div>

                <div className="bg-background p-4 rounded border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-foreground">ExpressVPN</h5>
                      <p className="text-xs text-muted-foreground mt-1">Fast VPN with excellent server coverage</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge className="bg-card text-blue-800 border-0 text-xs">256-bit</Badge>
                        <Badge className="bg-green-100 text-green-800 border-0 text-xs">Audited</Badge>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                  <Button className="w-full mt-4 bg-[#0a4fa6] hover:bg-[#003087] text-sm h-8">
                    Learn More
                  </Button>
                </div>

                <div className="bg-background p-4 rounded border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-foreground">Mullvad VPN</h5>
                      <p className="text-xs text-muted-foreground mt-1">Anonymous VPN with no account required</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge className="bg-card text-blue-800 border-0 text-xs">Open Source</Badge>
                        <Badge className="bg-green-100 text-green-800 border-0 text-xs">Privacy</Badge>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                  <Button className="w-full mt-4 bg-[#0a4fa6] hover:bg-[#003087] text-sm h-8">
                    Learn More
                  </Button>
                </div>

                <div className="bg-background p-4 rounded border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-foreground">CyberGhost</h5>
                      <p className="text-xs text-muted-foreground mt-1">User-friendly VPN for beginners</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge className="bg-card text-blue-800 border-0 text-xs">256-bit</Badge>
                        <Badge className="bg-green-100 text-green-800 border-0 text-xs">Streaming</Badge>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                  <Button className="w-full mt-4 bg-[#0a4fa6] hover:bg-[#003087] text-sm h-8">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Best Practices */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-lg p-6">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900 text-lg">Best Practices for Public WiFi Banking</h3>
              <ol className="mt-4 space-y-2 text-purple-900 text-sm list-decimal list-inside">
                <li>Only use banking apps, not web browsers for sensitive transactions</li>
                <li>Always verify you're using a secure, encrypted connection (HTTPS)</li>
                <li>Never enter passwords or financial information on unsecured networks</li>
                <li>Enable biometric authentication when available</li>
                <li>Keep your banking app and phone updated with latest security patches</li>
                <li>Disable Bluetooth and location services when not needed</li>
                <li>Log out immediately after completing transactions</li>
                <li>Monitor your accounts regularly for unauthorized activity</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
