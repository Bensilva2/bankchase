'use client'

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AlertCircle, Loader2 } from 'lucide-react'

interface DNSRecordDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => Promise<void>
  record?: any | null
}

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'SOA']

export function DNSRecordDrawer({
  open,
  onOpenChange,
  onSave,
  record,
}: DNSRecordDrawerProps) {
  const [formData, setFormData] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 3600,
    priority: 10,
    proxied: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (record) {
      setFormData({
        type: record.type || 'A',
        name: record.name || '',
        content: record.content || '',
        ttl: record.ttl || 3600,
        priority: record.priority || 10,
        proxied: record.proxied || false,
      })
    } else {
      setFormData({
        type: 'A',
        name: '',
        content: '',
        ttl: 3600,
        priority: 10,
        proxied: false,
      })
    }
    setError('')
  }, [record, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Record name is required')
      }
      if (!formData.content.trim()) {
        throw new Error('Record content is required')
      }

      await onSave(formData)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setLoading(false)
    }
  }

  const showPriority = ['MX', 'SRV'].includes(formData.type)
  const showProxied = formData.type === 'A' || formData.type === 'AAAA' || formData.type === 'CNAME'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {record ? 'Edit DNS Record' : 'Add DNS Record'}
          </SheetTitle>
          <SheetDescription>
            {record ? 'Modify the DNS record details' : 'Create a new DNS record for your domain'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Record Type</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {RECORD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name / Subdomain</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., www or @"
              value={formData.name}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground">
              Use @ for the root domain
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content / Value</Label>
            <Input
              id="content"
              name="content"
              placeholder={
                formData.type === 'A'
                  ? '192.0.2.1'
                  : formData.type === 'CNAME'
                    ? 'example.com'
                    : 'Record value'
              }
              value={formData.content}
              onChange={handleInputChange}
            />
          </div>

          {/* Priority */}
          {showPriority && (
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                name="priority"
                type="number"
                value={formData.priority}
                onChange={handleInputChange}
              />
            </div>
          )}

          {/* TTL */}
          <div className="space-y-2">
            <Label htmlFor="ttl">TTL (Time To Live)</Label>
            <select
              id="ttl"
              name="ttl"
              value={formData.ttl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={900}>15 minutes</option>
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
              <option value={86400}>1 day</option>
              <option value={1}>Auto</option>
            </select>
          </div>

          {/* Proxied */}
          {showProxied && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <input
                id="proxied"
                name="proxied"
                type="checkbox"
                checked={formData.proxied}
                onChange={handleInputChange}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <div>
                <Label htmlFor="proxied" className="cursor-pointer">
                  Proxy through Cloudflare
                </Label>
                <p className="text-xs text-muted-foreground">
                  Route traffic through Cloudflare network
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {record ? 'Update Record' : 'Create Record'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
