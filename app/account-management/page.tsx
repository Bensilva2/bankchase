'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react'

function AccountManagementContent() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      })
      if (response.ok) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('[v0] Failed to save profile:', error)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Account Management</h1>
            <p className="text-muted-foreground">Manage your account settings and information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              isEditing
                ? 'bg-red-600 text-background hover:bg-red-700'
                : 'bg-primary text-background hover:bg-primary'
            }`}
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Edit
              </>
            )}
          </button>
        </div>

        {/* Personal Information */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            Personal Information
          </h2>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full px-6 py-3 bg-green-600 text-background font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">First Name</p>
                  <p className="text-foreground font-medium">{formData.firstName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Last Name</p>
                  <p className="text-foreground font-medium">{formData.lastName || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p className="text-foreground font-medium">{formData.email || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <p className="text-foreground font-medium">{formData.phone || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-sm">Address</p>
                  <p className="text-foreground font-medium">
                    {formData.address
                      ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Account Information */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Account Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between p-4 bg-background rounded-lg">
              <p className="text-muted-foreground">Account Type</p>
              <p className="text-foreground font-medium">Checking</p>
            </div>
            <div className="flex justify-between p-4 bg-background rounded-lg">
              <p className="text-muted-foreground">Member Since</p>
              <p className="text-foreground font-medium">March 2018</p>
            </div>
            <div className="flex justify-between p-4 bg-background rounded-lg">
              <p className="text-muted-foreground">Status</p>
              <p className="text-foreground font-medium">Active</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default function AccountManagementPage() {
  return (
    <ProtectedRoute>
      <AccountManagementContent />
    </ProtectedRoute>
  )
}
