'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { ArrowLeft, Target, Plus, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SavingsGoalsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { savingsGoals = [], updateSavingsGoal, deleteSavingsGoal, addSavingsGoal } = useBanking()
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'General',
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleAddGoal = () => {
    if (!formData.name || !formData.targetAmount) {
      alert('Please fill in all required fields')
      return
    }
    addSavingsGoal?.({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      deadline: formData.deadline,
      category: formData.category,
    })
    setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'General' })
    setShowAddGoal(false)
  }

  const handleUpdateGoal = () => {
    if (editingGoal) {
      updateSavingsGoal?.(editingGoal.id, {
        currentAmount: parseFloat(formData.currentAmount) || editingGoal.currentAmount,
      })
      setEditingGoal(null)
      setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'General' })
    }
  }

  const getProgressPercentage = (goal: any) => {
    return (goal.currentAmount / goal.targetAmount) * 100
  }

  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const targetDate = new Date(deadline)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
              <p className="text-gray-600">Track and manage your financial goals</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddGoal(true)
              setEditingGoal(null)
              setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'General' })
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Goal
          </button>
        </div>

        {/* Add/Edit Goal Modal */}
        {(showAddGoal || editingGoal) && (
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingGoal ? 'Update Goal' : 'Create New Goal'}
            </h2>

            <div className="space-y-4">
              {!editingGoal && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Vacation Fund"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Amount ($)
                      </label>
                      <input
                        type="number"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        <option>General</option>
                        <option>Vacation</option>
                        <option>Emergency Fund</option>
                        <option>Education</option>
                        <option>Home</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
                <button
                  onClick={() => {
                    setShowAddGoal(false)
                    setEditingGoal(null)
                    setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'General' })
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Goals List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingsGoals.length > 0 ? (
            savingsGoals.map((goal: any) => {
              const progress = getProgressPercentage(goal)
              const daysRemaining = goal.deadline ? getDaysRemaining(goal.deadline) : null

              return (
                <Card key={goal.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{goal.name}</h3>
                      <p className="text-gray-600 text-sm">{goal.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingGoal(goal)
                          setFormData({
                            name: goal.name,
                            targetAmount: goal.targetAmount.toString(),
                            currentAmount: goal.currentAmount.toString(),
                            deadline: goal.deadline,
                            category: goal.category,
                          })
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSavingsGoal?.(goal.id)}
                        className="p-2 hover:bg-gray-100 rounded transition text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">${goal.currentAmount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">${goal.targetAmount.toFixed(2)}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{progress.toFixed(0)}% complete</p>
                  </div>

                  {/* Deadline */}
                  {daysRemaining !== null && (
                    <p
                      className={`text-sm font-medium ${
                        daysRemaining > 0 ? 'text-gray-600' : 'text-red-600'
                      }`}
                    >
                      {daysRemaining > 0
                        ? `${daysRemaining} days remaining`
                        : 'Deadline passed'}
                    </p>
                  )}
                </Card>
              )
            })
          ) : (
            <Card className="col-span-full p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No goals yet. Create your first savings goal!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
