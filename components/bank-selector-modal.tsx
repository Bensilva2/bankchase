"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { searchBanks, getBanksByRegion, type Bank } from "@/lib/bank-data"
import { Search, MapPin, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BankSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectBank: (bank: Bank) => void
}

export function BankSelectorModal({ open, onOpenChange, onSelectBank }: BankSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("northeast")

  const results = searchQuery ? searchBanks(searchQuery) : getBanksByRegion(selectedRegion)
  const regions = ["northeast", "midwest", "south", "west"]

  const regionLabels: Record<string, string> = {
    northeast: "Northeast",
    midwest: "Midwest",
    south: "South",
    west: "West",
  }

  const handleSelectBank = (bank: Bank) => {
    onSelectBank(bank)
    onOpenChange(false)
    setSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] md:h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Bank</DialogTitle>
        </DialogHeader>

        <div className="px-1 flex-1 flex flex-col min-h-0">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search banks by name, state, or routing number..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tabs for Regions */}
          {!searchQuery ? (
            <Tabs value={selectedRegion} onValueChange={setSelectedRegion} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                {regions.map((region) => (
                  <TabsTrigger key={region} value={region} className="text-xs md:text-sm">
                    {regionLabels[region]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {regions.map((region) => (
                <TabsContent key={region} value={region} className="flex-1 overflow-hidden">
                  <BankList banks={getBanksByRegion(region)} onSelectBank={handleSelectBank} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex-1 overflow-hidden">
              <BankList
                banks={results}
                onSelectBank={handleSelectBank}
                emptyMessage="No banks found matching your search."
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface BankListProps {
  banks: Bank[]
  onSelectBank: (bank: Bank) => void
  emptyMessage?: string
}

function BankList({ banks, onSelectBank, emptyMessage = "No banks available." }: BankListProps) {
  if (banks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-2">
        {banks.map((bank) => (
          <button
            key={bank.id}
            onClick={() => onSelectBank(bank)}
            className="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {bank.name}
                  <Badge variant={bank.type === "national" ? "default" : "secondary"} className="text-xs">
                    {bank.type === "national" ? "National" : bank.type === "regional" ? "Regional" : "Local"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {bank.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {bank.routing}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}
