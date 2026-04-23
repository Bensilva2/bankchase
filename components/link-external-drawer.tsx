"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBanking } from "@/lib/banking-context"
import { CheckCircle, Building2, AlertTriangle } from "lucide-react"

interface LinkExternalDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkExternalDrawer({ open, onOpenChange }: LinkExternalDrawerProps) {
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [routingNumber, setRoutingNumber] = useState("")
  const [accountType, setAccountType] = useState("Checking")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStep, setVerificationStep] = useState(0)
  const { toast } = useToast()
  const { addAccount, addNotification } = useBanking()

  const usBanks = [
    "Chase",
    "Bank of America",
    "Wells Fargo",
    "Citibank",
    "U.S. Bank",
    "PNC Bank",
    "Truist",
    "Goldman Sachs",
    "Capital One",
    "TD Bank",
    "BNY Mellon",
    "State Street",
    "American Express",
    "Citizens Financial",
    "Morgan Stanley",
    "Charles Schwab",
    "Ally Bank",
    "USAA",
    "Discover Bank",
    "Fidelity",
    "Navy Federal Credit Union",
    "Huntington Bank",
    "KeyBank",
    "Fifth Third Bank",
    "Regions Bank",
    "M&T Bank",
    "Northern Trust",
    "State Farm",
    "UBS",
    "Barclays",
    "Santander Bank",
    "Comerica",
    "Zions Bancorporation",
    "First Horizon",
    "Signature Bank",
    "People's United Bank",
    "New York Community Bank",
    "Synovus",
    "First Citizens Bank",
    "BMO Harris Bank",
    "East West Bank",
    "First Republic Bank",
    "Western Alliance Bank",
    "Cullen/Frost Bankers",
    "Valley National Bank",
    "Texas Capital Bank",
    "Commerce Bank",
    "Prosperity Bank",
    "Umpqua Bank",
    "South State Bank",
    "Hancock Whitney",
    "BankUnited",
    "First National Bank of Omaha",
    "Webster Bank",
    "FNB Corporation",
    "Glacier Bancorp",
    "Pinnacle Financial Partners",
    "PacWest Bancorp",
    "United Bank",
    "Arvest Bank",
    "Simmons Bank",
    "Old National Bank",
    "First Interstate Bank",
    "Ameris Bank",
    "Atlantic Union Bank",
    "Independent Bank",
    "Cadence Bank",
    "Cathay General Bancorp",
    "Trustmark",
    "WesBanco",
    "Washington Federal",
    "Hope Bancorp",
    "Columbia Banking System",
    "First Merchants",
    "Community Bank System",
    "Provident Financial Services",
    "NBT Bancorp",
    "Renasant",
    "TowneBank",
    "Park National",
    "First Financial Bancorp",
    "Sandy Spring Bancorp",
    "Eagle Bancorp",
    "Heartland Financial USA",
    "First Hawaiian",
    "WSFS Financial",
    "Enterprise Financial Services",
    "Lakeland Financial",
    "Customers Bancorp",
    "Berkshire Hills Bancorp",
    "First Busey",
    "TriCo Bancshares",
    "Brookline Bancorp",
    "Horizon Bancorp",
    "First Commonwealth Financial",
    "National Bank Holdings",
    "ServisFirst Bancshares",
    "Seacoast Banking Corporation",
    "City Holding",
    "First Bancorp",
    "Stock Yards Bancorp",
    "Tompkins Financial",
    "Midland States Bancorp",
    "Republic Bancorp",
    "First Financial Bankshares",
    "German American Bancorp",
    "QCR Holdings",
    "Farmers & Merchants Bancorp",
    "Mercantile Bank",
    "Peoples Bancorp",
    "Bryn Mawr Bank",
    "First Mid Bancshares",
    "Financial Institutions",
    "CNB Financial",
    "Bar Harbor Bankshares",
    "Camden National",
    "Orrstown Financial Services",
    "Univest Financial",
    "Acnb",
    "C&F Financial",
    "Arrow Financial",
    "First Community Bankshares",
    "Codorus Valley Bancorp",
    "Unity Bancorp",
    "First Internet Bancorp",
    "Norwood Financial",
    "Citizens & Northern",
    "Peapack-Gladstone Financial",
    "Evans Bancorp",
    "BCB Bancorp",
    "Bank of Marin Bancorp",
    "Sierra Bancorp",
    "Central Pacific Financial",
    "Heritage Financial",
    "Banner",
    "Westamerica Bancorporation",
    "Farmers National Banc",
    "Civista Bancshares",
    "Premier Financial",
    "Macatawa Bank",
    "Southern Missouri Bancorp",
    "HBT Financial",
    "CrossFirst Bankshares",
    "Red River Bancshares",
    "Reliant Bancorp",
    "Business First Bancshares",
    "Spirit of Texas Bancshares",
    "Guaranty Bancshares",
    "South Plains Financial",
    "First Foundation",
    "Hanmi Financial",
    "RBB Bancorp",
    "PCB Bancorp",
    "Metropolitan Bank Holding",
    "ConnectOne Bancorp",
    "Kearny Financial",
    "Flushing Financial",
    "Dime Community Bancshares",
    "Bridgewater Bancshares",
    "Hingham Institution for Savings",
    "Western New England Bancorp",
    "Meridian Bancorp",
    "HarborOne Bancorp",
    "Northeast Bank",
    "First Choice Bancorp",
    "BayCom",
    "Heritage Commerce",
    "Coastal Financial",
    "Timberland Bancorp",
    "FS Bancorp",
    "Territorial Bancorp",
    "Bank of Commerce",
    "Summit Financial Group",
    "MVB Financial",
    "First United",
    "Shore Bancshares",
    "The Community Financial",
    "ChoiceOne Financial Services",
    "Fidelity D & D Bancorp",
    "Franklin Financial Services",
    "Penns Woods Bancorp",
    "Mid Penn Bancorp",
    "Citizens Financial Services",
    "Chemung Financial",
  ]

  const handleLink = () => {
    if (!bankName || !accountNumber || !routingNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!/^\d{9}$/.test(routingNumber)) {
      toast({
        title: "Invalid Routing Number",
        description: "Routing number must be 9 digits",
        variant: "destructive",
      })
      return
    }

    if (!/^\d{8,17}$/.test(accountNumber)) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be 8-17 digits",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setVerificationStep(1)

    setTimeout(() => {
      setVerificationStep(2)
    }, 1000)

    setTimeout(() => {
      setVerificationStep(3)
    }, 2000)

    setTimeout(() => {
      const randomBalance = Math.floor(Math.random() * 15000) + 500

      addAccount({
        name: `${bankName} ${accountType}`,
        type: "External",
        balance: randomBalance,
        accountNumber: `...${accountNumber.slice(-4)}`,
        routingNumber: routingNumber,
      })

      addNotification({
        title: "External Account Linked",
        message: `Your ${bankName} ${accountType} account has been successfully linked.`,
        type: "success",
        category: "Accounts",
      })

      toast({
        title: "Account Linked Successfully!",
        description: `${bankName} ${accountType} has been added to your accounts`,
      })

      setBankName("")
      setAccountNumber("")
      setRoutingNumber("")
      setAccountType("Checking")
      setIsVerifying(false)
      setVerificationStep(0)
      onOpenChange(false)
    }, 3500)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0a4fa6]" />
            Link External Account
          </DrawerTitle>
        </DrawerHeader>

        {isVerifying ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-[#0a4fa6] border-t-transparent animate-spin" />
              {verificationStep >= 3 && <CheckCircle className="absolute inset-0 m-auto h-10 w-10 text-green-600" />}
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">
                {verificationStep === 1 && "Connecting to bank..."}
                {verificationStep === 2 && "Verifying account..."}
                {verificationStep === 3 && "Account verified!"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {verificationStep === 1 && "Establishing secure connection"}
                {verificationStep === 2 && "Validating account details"}
                {verificationStep === 3 && "Adding account to your profile"}
              </p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    verificationStep >= step ? "bg-[#0a4fa6]" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 space-y-4 overflow-y-auto pb-10">
              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#0a4fa6] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Link accounts from other banks to view all your finances in one place. Your credentials are never
                  stored.
                </p>
              </div>

              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger id="bank-name">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {usBanks.sort().map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="account-type">Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Checking">Checking</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Money Market">Money Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="routing-number">Routing Number</Label>
                <Input
                  id="routing-number"
                  placeholder="9 digits"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  maxLength={9}
                />
              </div>

              <div>
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  placeholder="8-17 digits"
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 17))}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleLink} className="bg-[#0a4fa6] hover:bg-[#083d82]">
                Link Account
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
