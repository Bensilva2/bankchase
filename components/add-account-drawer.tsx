"use client"

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { PlusCircle, CreditCard, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddAccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAccountDrawer({ open, onOpenChange }: AddAccountDrawerProps) {
  const { toast } = useToast()

  const handleAddAccount = (type: string) => {
    toast({
      title: "Account Added",
      description: `New ${type} account has been added successfully`,
    })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add New Account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-3 pb-6">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 bg-transparent"
            onClick={() => handleAddAccount("checking")}
          >
            <Wallet className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Checking Account</p>
              <p className="text-xs text-muted-foreground">Open a new checking account</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 bg-transparent"
            onClick={() => handleAddAccount("savings")}
          >
            <PlusCircle className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Savings Account</p>
              <p className="text-xs text-muted-foreground">Start saving for your goals</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 bg-transparent"
            onClick={() => handleAddAccount("credit card")}
          >
            <CreditCard className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Credit Card</p>
              <p className="text-xs text-muted-foreground">Apply for a new credit card</p>
            </div>
          </Button>
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
