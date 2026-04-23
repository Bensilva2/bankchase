"use client"

import { useState } from "react"
import { Target, Plus, Trash2, Edit2, TrendingUp, Calendar, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

export function SavingsGoalsView() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useBanking()
  const { toast } = useToast()

  const [openAddGoal, setOpenAddGoal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [goalName, setGoalName] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [goalCategory, setGoalCategory] = useState("Travel")
  const [goalDeadline, setGoalDeadline] = useState("")
  const [currentAmount, setCurrentAmount] = useState("0")

  const categories = ["Travel", "Home", "Education", "Emergency Fund", "Vehicle", "Wedding", "Vacation", "Retirement", "General"]

  const goalIcons: Record<string, string> = {
    Travel: "✈️",
    Home: "🏠",
    Education: "📚",
    "Emergency Fund": "🛟",
    Vehicle: "🚗",
    Wedding: "💍",
    Vacation: "🏖️",
    Retirement: "🏦",
    General: "🎯",
  }

  const handleAddOrUpdate = () => {
    if (!goalName || !goalAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (editingId) {
      updateSavingsGoal(editingId, {
        goalName,
        targetAmount: parseFloat(goalAmount),
        currentAmount: parseFloat(currentAmount),
        category: goalCategory,
        deadline: goalDeadline,
      })
      toast({
        title: "Goal Updated",
        description: `${goalName} has been updated successfully.`,
      })
    } else {
      addSavingsGoal({
        goalName,
        targetAmount: parseFloat(goalAmount),
        currentAmount: parseFloat(currentAmount),
        category: goalCategory,
        deadline: goalDeadline,
        createdDate: new Date().toISOString(),
      })
      toast({
        title: "Goal Created",
        description: `${goalName} goal has been created successfully.`,
      })
    }

    setGoalName("")
    setGoalAmount("")
    setGoalCategory("Travel")
    setGoalDeadline("")
    setCurrentAmount("0")
    setEditingId(null)
    setOpenAddGoal(false)
  }

  const handleEdit = (goal: any) => {
    setGoalName(goal.goalName || goal.name)
    setGoalAmount((goal.targetAmount || goal.target).toString())
    setCurrentAmount((goal.currentAmount || 0).toString())
    setGoalCategory(goal.category || "General")
    setGoalDeadline(goal.deadline || "")
    setEditingId(goal.id)
    setOpenAddGoal(true)
  }

  const handleDelete = (id: string) => {
    deleteSavingsGoal(id)
    toast({
      title: "Goal Deleted",
      description: "The goal has been deleted successfully.",
    })
  }

  const totalTarget = savingsGoals.reduce((acc, g) => acc + (g.targetAmount || g.target || 0), 0)
  const totalSaved = savingsGoals.reduce((acc, g) => acc + (g.currentAmount || 0), 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const goalsOnTrack = savingsGoals.filter(g => {
    const target = g.targetAmount || g.target || 0
    const current = g.currentAmount || 0
    return current >= (target * 0.8)
  }).length

  return (
    <div className="w-full space-y-6 p-6 pb-24 touch-pan-y overscroll-contain">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Savings Goals</h1>
        </div>
        <Button onClick={() => {
          setOpenAddGoal(true)
          setEditingId(null)
          setGoalName("")
          setGoalAmount("")
          setCurrentAmount("0")
        }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="text-2xl font-bold">${totalSaved.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Goal</p>
              <p className="text-2xl font-bold">${totalTarget.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Track</p>
              <p className="text-2xl font-bold">{goalsOnTrack} / {savingsGoals.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{overallProgress.toFixed(1)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="space-y-4">
        {savingsGoals && savingsGoals.length > 0 ? (
          savingsGoals.map((goal: any) => {
            const target = goal.targetAmount || goal.target || 0
            const current = goal.currentAmount || 0
            const progress = target > 0 ? (current / target) * 100 : 0
            const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
            const isOnTrack = current >= (target * 0.8)

            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{goalIcons[goal.category || goal.goalCategory || "General"]}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{goal.goalName || goal.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{goal.category || goal.goalCategory}</Badge>
                          {isOnTrack && <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />On Track</Badge>}
                          {!isOnTrack && daysLeft && daysLeft < 30 && <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Urgent</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>${current.toFixed(2)} of ${target.toFixed(2)}</span>
                      <span className="font-semibold">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {daysLeft !== null && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${(target - current).toFixed(2)} to go
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No savings goals yet. Create your first goal!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={openAddGoal} onOpenChange={setOpenAddGoal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Goal" : "Create New Savings Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input
                id="goal-name"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g., Dream Vacation"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={goalCategory} onValueChange={setGoalCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target">Target Amount ($)</Label>
                <Input
                  id="target"
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label htmlFor="current">Current Amount ($)</Label>
                <Input
                  id="current"
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="deadline">Target Date</Label>
              <Input
                id="deadline"
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddGoal(false)}>Cancel</Button>
            <Button onClick={handleAddOrUpdate}>{editingId ? "Update" : "Create"} Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
