'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield, Mail, Phone, MapPin, Calendar, Lock, ArrowLeft } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a4fa6] to-[#003087]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  // Mask SSN (show only last 4 digits)
  const maskedSSN = user.ssn ? `***-**-${user.ssn.slice(-4)}` : 'Not provided'

  // Format date of birth
  const formattedDOB = user.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not provided'

  // Calculate member since date (registration date)
  const memberSinceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'editor':
        return 'bg-card text-blue-800'
      case 'viewer':
        return 'bg-background text-foreground'
      default:
        return 'bg-background text-foreground'
    }
  }

  const getRoleBadgeLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'editor':
        return 'Editor'
      case 'viewer':
        return 'Viewer'
      default:
        return 'User'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#0a4fa6] hover:underline mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header Section */}
        <Card className="bg-background shadow-lg mb-6 border-0">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-[#0a4fa6]">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-[#0a4fa6] text-background text-xl font-bold">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-muted-foreground mt-1">@{user.username}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#0a4fa6]" />
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(user.role)}`}>
                      {getRoleBadgeLabel(user.role)}
                    </span>
                  </div>
                </div>
              </div>
              {!editMode && (
                <Button
                  onClick={() => setEditMode(true)}
                  className="bg-[#0a4fa6] hover:bg-[#003087]"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Personal Information Section */}
        <Card className="bg-background shadow-lg border-0 mb-6">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Personal Information</h2>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4 pb-6 border-b border-border">
                <Mail className="w-5 h-5 text-[#0a4fa6] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">Email Address</p>
                  <p className="text-lg text-foreground mt-1">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 pb-6 border-b border-border">
                <Phone className="w-5 h-5 text-[#0a4fa6] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">Phone Number</p>
                  <p className="text-lg text-foreground mt-1">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-start gap-4 pb-6 border-b border-border">
                <Calendar className="w-5 h-5 text-[#0a4fa6] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">Date of Birth</p>
                  <p className="text-lg text-foreground mt-1">{formattedDOB}</p>
                </div>
              </div>

              {/* SSN */}
              <div className="flex items-start gap-4 pb-6 border-b border-border">
                <Lock className="w-5 h-5 text-[#0a4fa6] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">Social Security Number</p>
                  <p className="text-lg text-foreground mt-1 font-mono">{maskedSSN}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last 4 digits displayed for security</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-[#0a4fa6] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">Address</p>
                  <p className="text-lg text-foreground mt-1">
                    {user.address || 'Not provided'}
                  </p>
                  {(user.city || user.state || user.zipCode) && (
                    <p className="text-lg text-foreground mt-1">
                      {user.city && `${user.city}, `}
                      {user.state && `${user.state} `}
                      {user.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Information Section */}
        <Card className="bg-background shadow-lg border-0">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Account Information</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground font-medium">Account Type</span>
                <span className="text-foreground font-semibold">Checking</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground font-medium">Account Status</span>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground font-medium">Member Since</span>
                <span className="text-foreground font-semibold">{memberSinceDate}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Role</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(user.role)}`}>
                  {getRoleBadgeLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
