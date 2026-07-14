'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface DNSRecord {
  id: string
  type: string
  name: string
  content: string
  ttl: number
  proxied?: boolean
}

interface DNSRecordsTableProps {
  records: DNSRecord[]
  onEdit: (record: DNSRecord) => void
  onDelete: (recordId: string) => void
}

export function DNSRecordsTable({ records, onEdit, onDelete }: DNSRecordsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getRecordTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      A: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      AAAA: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      CNAME: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      MX: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      TXT: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      NS: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      SOA: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    }
    return colors[type] || 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Content</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">TTL</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr
              key={record.id}
              className={`border-b border-border transition-colors ${
                index % 2 === 0 ? 'bg-background' : 'bg-secondary/30'
              } hover:bg-secondary/50`}
            >
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(record.type)}`}>
                  {record.type}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-foreground">
                <code className="bg-secondary px-2 py-1 rounded text-xs">{record.name}</code>
              </td>
              <td className="px-6 py-4 text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <code className="bg-secondary px-2 py-1 rounded text-xs truncate max-w-xs">
                    {record.content}
                  </code>
                  <button
                    onClick={() => copyToClipboard(record.content, record.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedId === record.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-foreground">
                {record.ttl === 1 ? 'Auto' : `${record.ttl}s`}
              </td>
              <td className="px-6 py-4 text-sm">
                {record.proxied ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Proxied
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground">
                    DNS Only
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(record)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(record.id)}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
