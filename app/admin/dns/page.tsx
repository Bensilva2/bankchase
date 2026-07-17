'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DNSRecordsTable } from '@/components/dns-records-table'
import { DNSRecordDrawer } from '@/components/dns-record-drawer'
import { useCloudflareDNS } from '@/lib/hooks/use-cloudflare'
import { Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function DNSManagementPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [selectedZone, setSelectedZone] = useState('')
  const [zones, setZones] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  
  const {
    loading,
    error,
    listRecords,
    createRecord: createDNSRecord,
    updateRecord: updateDNSRecord,
    deleteRecord: deleteDNSRecord,
  } = useCloudflareDNS()

  // Fetch zones from API
  const fetchZones = useCallback(async () => {
    try {
      const response = await fetch('/api/cloudflare/dns?action=zones')
      const data = await response.json()
      if (data.zones) {
        setZones(data.zones)
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err)
    }
  }, [])

  // Fetch records for selected zone
  const fetchRecords = useCallback(async (zoneId: string) => {
    if (!zoneId) return
    try {
      const records = await listRecords(zoneId)
      setRecords(Array.isArray(records) ? records : [])
    } catch (err) {
      console.error('Failed to fetch records:', err)
      setRecords([])
    }
  }, [listRecords])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  useEffect(() => {
    if (selectedZone) {
      fetchRecords(selectedZone)
    }
  }, [selectedZone, fetchRecords])

  const handleOpenDrawer = (record = null) => {
    setEditingRecord(record)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setEditingRecord(null)
  }

  const handleSaveRecord = async (recordData: any) => {
    try {
      if (editingRecord) {
        await updateDNSRecord(selectedZone, (editingRecord as any).id, recordData)
      } else {
        await createDNSRecord(selectedZone, recordData)
      }
      handleCloseDrawer()
      await fetchRecords(selectedZone)
    } catch (err) {
      console.error('Failed to save record:', err)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this DNS record?')) {
      try {
        await deleteDNSRecord(selectedZone, recordId)
        await fetchRecords(selectedZone)
      } catch (err) {
        console.error('Failed to delete record:', err)
      }
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">DNS Management</h1>
          <p className="text-muted-foreground">
            Manage your Cloudflare DNS records
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Card className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
              <p className="text-sm text-red-800 dark:text-red-200">{error instanceof Error ? error.message : String(error)}</p>
            </div>
          </Card>
        )}

        {/* Zone Selection */}
        <Card className="bg-card border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Zone</h2>
          <div className="flex gap-3 flex-wrap">
            {zones.length === 0 ? (
              <p className="text-muted-foreground">Loading zones...</p>
            ) : (
              zones.map((zone) => (
                <Button
                  key={zone.id}
                  variant={selectedZone === zone.id ? 'default' : 'outline'}
                  onClick={() => setSelectedZone(zone.id)}
                  className="rounded-full"
                >
                  {zone.name}
                </Button>
              ))
            )}
          </div>
        </Card>

        {/* Actions */}
        {selectedZone && (
          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => handleOpenDrawer()}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add DNS Record
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchRecords(selectedZone)}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}

        {/* Records Table */}
        {selectedZone && (
          <Card className="bg-card border-border overflow-hidden">
            {loading && records.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin mb-4">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground">Loading DNS records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No DNS records found</p>
                <Button onClick={() => handleOpenDrawer()}>
                  Create First Record
                </Button>
              </div>
            ) : (
              <DNSRecordsTable
                records={records}
                onEdit={handleOpenDrawer}
                onDelete={handleDeleteRecord}
              />
            )}
          </Card>
        )}

        {!selectedZone && zones.length > 0 && (
          <Card className="bg-card border-border p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Select a zone to manage DNS records</p>
          </Card>
        )}
      </div>

      {/* DNS Record Drawer */}
      <DNSRecordDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSave={handleSaveRecord}
        record={editingRecord}
      />
    </main>
  )
}
