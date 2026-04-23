"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Gift,
  Star,
  Plane,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  DollarSign,
  CheckCircle,
  Bookmark,
  Trash2,
  X,
  Clock,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shopping: ShoppingBag,
  Travel: Plane,
  Dining: Utensils,
  Groceries: ShoppingBag,
  Automotive: Car,
  Home: Home,
  Rewards: Star,
  "Cash Back": DollarSign,
}

export function OffersView() {
  const { toast } = useToast()
  const { offers, activateOffer, saveOffer, deleteOffer, userProfile } = useBanking()
  const [selectedOffer, setSelectedOffer] = useState<(typeof offers)[0] | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleActivate = (offerId: string, offerTitle: string) => {
    activateOffer(offerId)
    toast({
      title: "Offer Activated!",
      description: `${offerTitle} has been added to your account`,
    })
  }

  const handleSave = (offerId: string, offerTitle: string, isSaved: boolean) => {
    saveOffer(offerId)
    toast({
      title: isSaved ? "Offer Removed" : "Offer Saved",
      description: isSaved ? `${offerTitle} removed from saved offers` : `${offerTitle} saved for later`,
    })
  }

  const handleDelete = (offerId: string, offerTitle: string) => {
    deleteOffer(offerId)
    toast({
      title: "Offer Deleted",
      description: `${offerTitle} has been removed`,
    })
  }

  const openDetails = (offer: (typeof offers)[0]) => {
    setSelectedOffer(offer)
    setDetailsOpen(true)
  }

  const activeOffers = offers.filter((o) => !o.activated)
  const activatedOffers = offers.filter((o) => o.activated)
  const savedOffers = offers.filter((o) => o.saved)

  const renderOfferCard = (offer: (typeof offers)[0]) => {
    const Icon = categoryIconMap[offer.category] || Gift
    const isExpired = new Date(offer.expiresAt) < new Date()

    return (
      <Card key={offer.id} className={`p-4 ${isExpired ? "opacity-60" : ""}`}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-[#0060A9]/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6 text-[#0060A9]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{offer.title}</h3>
                <span className="text-sm font-medium text-[#0060A9]">{offer.discount}</span>
              </div>
              <Badge variant={isExpired ? "destructive" : offer.activated ? "default" : "secondary"}>
                {isExpired ? "Expired" : offer.activated ? "Active" : offer.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{offer.description}</p>
            <p className="text-xs text-muted-foreground mb-1">at {offer.merchant}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Clock className="h-3 w-3" />
              <span>{isExpired ? "Expired" : `Expires ${new Date(offer.expiresAt).toLocaleDateString()}`}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {offer.activated ? (
                <Button size="sm" variant="outline" disabled className="gap-2 bg-transparent">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Activated
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-[#0060A9] hover:bg-[#004d87]"
                  onClick={() => handleActivate(offer.id, offer.title)}
                  disabled={isExpired}
                >
                  Activate
                </Button>
              )}
              <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openDetails(offer)}>
                Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={offer.saved ? "text-yellow-500" : ""}
                onClick={() => handleSave(offer.id, offer.title, offer.saved)}
              >
                <Bookmark className={`h-4 w-4 ${offer.saved ? "fill-current" : ""}`} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(offer.id, offer.title)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="pb-24 space-y-6 touch-pan-y overscroll-contain">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Offers</h2>
        <p className="text-sm text-muted-foreground mb-6">Exclusive deals and rewards just for you</p>

        {/* Points Summary Card */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-[#0060A9] to-[#117ACA] text-white">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8" />
            <div>
              <h3 className="font-bold text-lg">Chase Ultimate Rewards</h3>
              <p className="text-sm opacity-90">
                You have {userProfile.ultimateRewardsPoints.toLocaleString()} points worth $
                {(userProfile.ultimateRewardsPoints * 0.01).toFixed(2)}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="mt-3">
            Redeem Points
          </Button>
        </Card>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All ({activeOffers.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedOffers.length})</TabsTrigger>
            <TabsTrigger value="activated">Activated ({activatedOffers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {activeOffers.length === 0 ? (
              <Card className="p-8 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No available offers at this time</p>
              </Card>
            ) : (
              activeOffers.map(renderOfferCard)
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedOffers.length === 0 ? (
              <Card className="p-8 text-center">
                <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No saved offers</p>
                <p className="text-xs text-muted-foreground mt-1">Tap the bookmark icon to save offers for later</p>
              </Card>
            ) : (
              savedOffers.map(renderOfferCard)
            )}
          </TabsContent>

          <TabsContent value="activated" className="space-y-4">
            {activatedOffers.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No activated offers yet</p>
              </Card>
            ) : (
              activatedOffers.map(renderOfferCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Offer Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedOffer?.title}</DialogTitle>
              <button onClick={() => setDetailsOpen(false)} className="rounded-sm opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = categoryIconMap[selectedOffer.category] || Gift
                  return (
                    <div className="h-16 w-16 rounded-full bg-[#0060A9]/10 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-[#0060A9]" />
                    </div>
                  )
                })()}
                <div>
                  <Badge variant={selectedOffer.activated ? "default" : "secondary"}>{selectedOffer.category}</Badge>
                  <p className="text-xl font-bold text-[#0060A9] mt-1">{selectedOffer.discount}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedOffer.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Merchant</p>
                  <p className="text-sm">{selectedOffer.merchant}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm">{selectedOffer.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="text-sm">
                    {new Date(selectedOffer.expiresAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={selectedOffer.activated ? "default" : "outline"}>
                    {selectedOffer.activated ? "Activated" : "Not Activated"}
                  </Badge>
                </div>
              </div>

              {selectedOffer.terms && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Terms & Conditions:</p>
                  <p>{selectedOffer.terms}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedOffer && !selectedOffer.activated && (
              <Button
                className="flex-1 bg-[#0060A9] hover:bg-[#004d87]"
                onClick={() => {
                  handleActivate(selectedOffer.id, selectedOffer.title)
                  setDetailsOpen(false)
                }}
              >
                Activate Offer
              </Button>
            )}
            {selectedOffer && (
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  handleSave(selectedOffer.id, selectedOffer.title, selectedOffer.saved)
                  setDetailsOpen(false)
                }}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${selectedOffer.saved ? "fill-current" : ""}`} />
                {selectedOffer.saved ? "Unsave" : "Save"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
