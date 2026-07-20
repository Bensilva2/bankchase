'use client'

import { useEffect, useState } from 'react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'

interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  deadline: string
  category: string
  created_at: string
}

export default function PlanTrackPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', category: 'Savings', deadline: '' })
  const [submitting, setSubmitting] = useState(false)

  // Load goals on mount
  useEffect(() => {
    loadGoals()
    }
  }, [isAuthenticated, user])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()
      const response = await fetch('/api/goals', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      } else {
        console.error('Failed to load goals')
        setGoals([])
      }
    } catch (error) {
      console.error('Error loading goals:', error)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) return

    try {
      setSubmitting(true)
      const token = await user?.getIdToken()
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newGoal.title,
          targetAmount: parseFloat(newGoal.targetAmount),
          deadline: newGoal.deadline,
          category: newGoal.category,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGoals([...goals, data.goal])
        setNewGoal({ title: '', targetAmount: '', category: 'Savings', deadline: '' })
        setShowNewGoalForm(false)
      } else {
        alert('Failed to create goal')
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      alert('Error creating goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const token = await user?.getIdToken()
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setGoals(goals.filter((g) => g.id !== goalId))
      } else {
        alert('Failed to delete goal')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Error deleting goal')
    }
  }

  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0)
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0)
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your goals</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-0">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Plan & Track</h1>
          <p className="text-muted-foreground mt-2">Your financial goals and progress</p>
        </div>
        <button
          onClick={() => setShowNewGoalForm(!showNewGoalForm)}
          className="bg-primary text-background px-6 py-3 rounded-2xl font-medium hover:bg-primary"
        >
          + New Goal
        </button>
      </div>

      {showNewGoalForm && (
        <form onSubmit={handleAddGoal} className="bg-background p-8 rounded-3xl shadow mb-8 space-y-4">
          <input
            type="text"
            placeholder="Goal title"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            className="w-full border border-border rounded-2xl p-3"
            required
          />
          <input
            type="number"
            placeholder="Target amount"
            value={newGoal.targetAmount}
            onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
            className="w-full border border-border rounded-2xl p-3"
            required
          />
          <select
            value={newGoal.category}
            onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
            className="w-full border border-border rounded-2xl p-3"
          >
            <option>Savings</option>
            <option>Vehicle</option>
            <option>Travel</option>
            <option>Education</option>
            <option>Home</option>
            <option>Other</option>
          </select>
          <input
            type="date"
            value={newGoal.deadline}
            onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
            className="w-full border border-border rounded-2xl p-3"
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-primary text-background py-3 rounded-2xl font-semibold hover:bg-primary disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Goal'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewGoalForm(false)}
              className="flex-1 bg-card text-foreground py-3 rounded-2xl font-semibold hover:bg-card"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-background p-8 rounded-3xl shadow">
          <p className="text-muted-foreground text-sm">Total Saved</p>
          <p className="text-4xl font-bold mt-3">${totalSaved.toLocaleString()}</p>
          <p className="text-green-600 text-sm mt-2">↑ 12% this month</p>
        </div>

        <div className="bg-background p-8 rounded-3xl shadow">
          <p className="text-muted-foreground text-sm">Goals on Track</p>
          <p className="text-4xl font-bold mt-3">{goals.filter((g) => (g.current_amount / g.target_amount) >= 0.5).length} of {goals.length}</p>
          <p className="text-amber-600 text-sm mt-2">{goals.length - goals.filter((g) => (g.current_amount / g.target_amount) >= 0.5).length} needs attention</p>
        </div>

        <div className="bg-background p-8 rounded-3xl shadow">
          <p className="text-muted-foreground text-sm">Overall Progress</p>
          <p className="text-4xl font-bold mt-3">{overallProgress}%</p>
          <div className="h-2 bg-background rounded-full mt-4">
            <div className="h-2 bg-primary rounded-full" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <h2 className="text-2xl font-semibold mb-6">Your Goals</h2>

      {loading ? (
        <div className="text-center py-8 bg-background rounded-lg">
          <p className="text-muted-foreground">Loading your goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-8 bg-background rounded-lg">
          <p className="text-muted-foreground">No goals yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {goals.map((goal) => {
            const progress = Math.round((goal.current_amount / goal.target_amount) * 100)
            const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            return (
              <div key={goal.id} className="bg-background p-8 rounded-3xl shadow hover:shadow-lg transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{goal.title}</h3>
                    <p className="text-muted-foreground mt-1">{goal.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${goal.current_amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">of ${goal.target_amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 h-3 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mt-2 mb-4">
                  <span className="font-medium">{progress}% Complete</span>
                  <span className={`${daysLeft < 30 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                    {daysLeft} days left
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete Goal
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Spending Insights */}
      <div className="mt-12 bg-background p-8 rounded-3xl shadow">
        <h3 className="text-xl font-semibold mb-6">Spending Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-green-600 font-medium">You&apos;re spending 18% less than last month</p>
            <p className="text-sm text-muted-foreground mt-2">Great job staying within budget!</p>
          </div>
          <div>
            <p className="text-amber-600 font-medium">Dining out is your highest category this month</p>
            <p className="text-sm text-muted-foreground mt-2">Consider setting a limit</p>
          </div>
        </div>
      </div>
    </div>
  )
}
