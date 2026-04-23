"use client"

import { useState } from "react"
import { Wallet, Target, PiggyBank, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

export function PlanTrackView() {
  const {
    calculateSpending,
    getSpendingByCategory,
    savingsGoals,
    updateSavingsGoal,
    addSavingsGoal,
    deleteSavingsGoal,
    accounts,
  } = useBanking()
  const { toast } = useToast()

  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [addAmountOpen, setAddAmountOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState("")

  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalTarget, setNewGoalTarget] = useState("")
  const [newGoalCategory, setNewGoalCategory] = useState("General")
  const [newGoalDeadline, setNewGoalDeadline] = useState("")

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlySpending = calculateSpending(currentMonth, currentYear)
  const spendingByCategory = getSpendingByCategory(currentMonth, currentYear)
  const totalBudget = 20000
  const spendingPercentage = Math.min((monthlySpending / totalBudget) * 100, 100)

  const totalSavingsTarget = savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0)
  const totalSavingsCurrent = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0)
  const overallSavingsPercentage = totalSavingsTarget > 0 ? (totalSavingsCurrent / totalSavingsTarget) * 100 : 0

  const categoryColors: Record<string, string> = {
    "Food & Drink": "bg-orange-500",
    "Bills & Utilities": "bg-blue-500",
    Shopping: "bg-purple-500",
    Entertainment: "bg-pink-500",
    Transportation: "bg-green-500",
    Transfers: "bg-gray-500",
    Income: "bg-emerald-500",
    Savings: "bg-cyan-500",
  }

  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance ?? 0), 0)

  const handleAddToGoal = (goalId: string, amount: number) => {
    const goal = savingsGoals.find((g) => g.id === goalId)
    if (!goal) return

    if (amount > totalBalance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance for this contribution.",
        variant: "destructive",
      })
      return
    }

    updateSavingsGoal(goalId, amount)
    toast({
      title: "Contribution Added",
      description: `$${amount.toFixed(2)} added to ${goal.name}`,
    })
    setAddAmountOpen(false)
    setCustomAmount("")
  }

  const handleCreateGoal = () => {
    if (!newGoalName || !newGoalTarget || !newGoalDeadline) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    addSavingsGoal({
      name: newGoalName,
      targetAmount: Number(newGoalTarget),
      currentAmount: 0,
      deadline: newGoalDeadline,
      category: newGoalCategory,
    })

    toast({
      title: "Goal Created",
      description: `${newGoalName} savings goal has been created`,
    })

    setNewGoalName("")
    setNewGoalTarget("")
    setNewGoalCategory("General")
    setNewGoalDeadline("")
    setAddGoalOpen(false)
  }

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    deleteSavingsGoal(goalId)
    toast({
      title: "Goal Deleted",
      description: `${goalName} has been removed`,
    })
  }

  const openAddAmount = (goalId: string) => {
    setSelectedGoalId(goalId)
    setAddAmountOpen(true)
  }

  return (
    <div className="space-y-6 pb-24 touch-pan-y overscroll-contain">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="chase-card-shadow border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spending This Month</CardTitle>
            <Wallet className="h-4 w-4 text-[#0a4fa6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlySpending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              of ${totalBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })} budget
            </p>
            <Progress value={spendingPercentage} className="mt-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {spendingPercentage.toFixed(1)}% of monthly budget used
            </p>
          </CardContent>
        </Card>

        <Card className="chase-card-shadow border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings Goals</CardTitle>
            <PiggyBank className="h-4 w-4 text-[#0a4fa6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSavingsCurrent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              of ${totalSavingsTarget.toLocaleString("en-US", { minimumFractionDigits: 2 })} target
            </p>
            <Progress value={overallSavingsPercentage} className="mt-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {overallSavingsPercentage.toFixed(1)}% of savings goals achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Savings Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-[#0a4fa6]" />
            Savings Goals
          </h3>
          <Button size="sm" variant="outline" className="bg-transparent" onClick={() => setAddGoalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>

        {savingsGoals.length === 0 ? (
          <Card className="p-8 text-center chase-card-shadow border-0">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No savings goals yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a goal to start saving</p>
            <Button className="mt-4 bg-[#0a4fa6]" onClick={() => setAddGoalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create First Goal
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savingsGoals.map((goal) => {
              const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
              const isComplete = goal.currentAmount >= goal.targetAmount
              const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

              return (
                <Card key={goal.id} className="p-4 chase-card-shadow border-0">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{goal.name}</h4>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={isComplete ? "default" : "secondary"}
                        className={`text-xs ${isComplete ? "bg-green-600" : ""}`}
                      >
                        {isComplete ? "Complete!" : goal.category}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleDeleteGoal(goal.id, goal.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={percentage} className={`h-2 ${isComplete ? "[&>div]:bg-green-600" : ""}`} />
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">
                        €{goal.currentAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-muted-foreground">
                        €{goal.targetAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isComplete
                        ? "Goal reached! "
                        : `€${remaining.toLocaleString("de-DE", { minimumFractionDigits: 2 })} to go | `}
                      {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
                    </p>
                  </div>
                  {!isComplete && (
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-[#0a4fa6] hover:bg-[#083d82]"
                      onClick={() => openAddAmount(goal.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Money
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Spending by Category */}
      <div className="space-y-4">
        <h3 className="font-semibold">Spending by Category</h3>
        <div className="space-y-4">
          {spendingByCategory.length > 0 ? (
            spendingByCategory
              .sort((a, b) => b.amount - a.amount)
              .map((item, index) => {
                const percentage = monthlySpending > 0 ? (item.amount / monthlySpending) * 100 : 0
                return (
                  <Card key={index} className="p-4 chase-card-shadow border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${categoryColors[item.category] || "bg-gray-400"}`} />
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <span className="font-bold">
                        €{item.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% of total spending</p>
                  </Card>
                )
              })
          ) : (
            <Card className="p-6 text-center chase-card-shadow border-0">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No spending data for this month yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Emergency Fund, Vacation"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Amount (€)</Label>
              <Input
                type="number"
                placeholder="5000"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newGoalCategory} onValueChange={setNewGoalCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Emergency">Emergency Fund</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Retirement">Retirement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#0a4fa6]" onClick={handleCreateGoal}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Amount Dialog */}
      <Dialog open={addAmountOpen} onOpenChange={setAddAmountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Available balance: €{totalBalance.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 250].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => selectedGoalId && handleAddToGoal(selectedGoalId, amount)}
                  disabled={amount > totalBalance}
                >
                  €{amount}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Custom Amount</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <Button
                  className="bg-[#0a4fa6]"
                  onClick={() =>
                    selectedGoalId && customAmount && handleAddToGoal(selectedGoalId, Number(customAmount))
                  }
                  disabled={!customAmount || Number(customAmount) <= 0 || Number(customAmount) > totalBalance}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
