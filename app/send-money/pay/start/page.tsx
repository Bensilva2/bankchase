'use client'

import { useState } from 'react'
import { useBanking } from '@/lib/banking-context'
import { TransferDialog } from '@/components/transfer-dialog'
import { PayBillsDrawer } from '@/components/pay-bills-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Check, ChevronDown, FileUp, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const recentRecipients = [
  { name: 'Domestic Ads', detail: 'Recently paid' },
  { name: 'Aliyah McMahon', detail: 'Nutritionist · aliyah@mcmahon.com' },
  { name: 'Jason Green', detail: 'Contractor · jason@green.com' },
]

export default function PayStartPage() {
  const router = useRouter()
  const { userProfile, accounts } = useBanking()
  const [search, setSearch] = useState('')
  const [transferType, setTransferType] = useState<'zelle' | 'internal' | 'bank_transfer'>('zelle')
  const [transferOpen, setTransferOpen] = useState(false)
  const [billsOpen, setBillsOpen] = useState(false)

  const openTransfer = (type: 'zelle' | 'internal' | 'bank_transfer') => {
    setTransferType(type)
    setTransferOpen(true)
  }

  const visibleRecipients = recentRecipients.filter((recipient) =>
    `${recipient.name} ${recipient.detail}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-[#fbfbfc] text-[#25252c]">
      <div className="flex min-h-14 items-center justify-between bg-[#373744] px-5 text-sm text-white md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 text-xs font-semibold">M</div>
          <span>Explore the Mercury Demo.</span>
          <button className="underline underline-offset-4" type="button">Customize your experience</button>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2" type="button">
            Viewing as Admin <ChevronDown className="h-4 w-4" />
          </button>
          <button className="rounded-full bg-[#5269e8] px-5 py-2 font-medium" type="button">Open account</button>
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-4xl flex-col px-6 py-12 md:px-12">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#25252c] text-xs font-semibold">M</div>
          <div className="h-7 w-px bg-[#dedee3]" />
          <span>Mercury Demo</span>
          <button className="ml-auto rounded-full p-2 text-[#555562] transition hover:bg-[#f0f0f3]" type="button" onClick={() => router.back()} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <section className="mx-auto mt-16 w-full max-w-[560px]">
          <h1 className="text-3xl font-medium tracking-[-0.03em] md:text-[34px]">How would you like to start?</h1>

          <div className="mt-8">
            <h2 className="text-base font-medium">Upload a bill</h2>
            <p className="mt-2 text-sm text-[#60606b]">Use this to automatically pre-fill your recipient&apos;s payment details.</p>
            <label className="mt-4 flex h-28 cursor-pointer items-center justify-center gap-4 rounded-lg border border-[#dedee3] bg-white transition hover:border-[#8b8b96]">
              <FileUp className="h-6 w-6 text-[#6a6a75]" />
              <span>
                <span className="block text-sm font-medium">Drag and drop here or click to upload</span>
                <span className="mt-1 block text-xs text-[#777782]">Upload images, PDFs, or spreadsheets</span>
              </span>
              <input className="sr-only" type="file" accept="image/png,image/jpeg,application/pdf,.csv,.xlsx" />
            </label>
          </div>

          <div className="my-8 flex items-center gap-4 text-xs text-[#777782]">
            <div className="h-px flex-1 bg-[#e3e3e6]" />
            <span>OR</span>
            <div className="h-px flex-1 bg-[#e3e3e6]" />
          </div>

          <div>
            <h2 className="text-base font-medium">Select a recipient</h2>
            <label className="mt-4 block text-xs font-medium text-[#5269e8]" htmlFor="recipient-search">Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#777782]" />
              <Input
                id="recipient-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 rounded-md border-[#5269e8] bg-white pl-10 shadow-[0_1px_2px_rgba(0,0,0,0.08)] focus-visible:ring-[#5269e8]"
                placeholder="Search recipients"
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button className="h-11 rounded-md bg-[#5269e8] hover:bg-[#4359d2]" onClick={() => openTransfer('zelle')}>Create recipient</Button>
              <Button variant="outline" className="h-11 rounded-md border-[#d9d9df] bg-white" onClick={() => openTransfer('zelle')}>Invite recipient</Button>
            </div>

            <p className="mt-8 text-xs font-medium text-[#777782]">Recently paid</p>
            <div className="mt-3 divide-y divide-[#ededf0] overflow-hidden rounded-lg border border-[#ededf0] bg-white">
              {visibleRecipients.map((recipient) => (
                <button key={recipient.name} type="button" onClick={() => openTransfer('zelle')} className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#f7f7f9]">
                  <span>
                    <span className="block text-sm font-medium">{recipient.name}</span>
                    <span className="mt-1 block text-xs text-[#777782]">{recipient.detail}</span>
                  </span>
                  <Check className="h-4 w-4 text-[#5269e8]" />
                </button>
              ))}
              {visibleRecipients.length === 0 && <p className="px-4 py-5 text-sm text-[#777782]">No recipients found.</p>}
            </div>
          </div>

          <div className="mt-8 flex justify-start">
            <Button variant="ghost" className="text-[#60606b]" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </section>
      </div>

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} transferType={transferType} userId={userProfile?.id || 'demo-user'} userAccounts={accounts} />
      <PayBillsDrawer open={billsOpen} onOpenChange={setBillsOpen} />
    </main>
  )
}
