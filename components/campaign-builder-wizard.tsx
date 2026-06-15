'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { CampaignFormData, CampaignStep, campaignSteps, campaignObjectives, biddingStrategies } from '@/lib/campaign-builder'

export function CampaignBuilderWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<CampaignFormData>({
    campaignName: '',
    campaignObjective: 'awareness',
    budgetType: 'daily',
    dailyBudget: 10,
    targetAudience: {
      ageMin: 18,
      ageMax: 65,
      gender: 'all',
      locations: [],
      interests: [],
    },
    adGroups: [],
  })

  const handleNext = () => {
    if (currentStep < campaignSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const currentCampaignStep = campaignSteps[currentStep]

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create New Campaign</h1>
          <p className="text-muted-foreground">Step {currentStep + 1} of {campaignSteps.length}: {currentCampaignStep.title}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2">
            {campaignSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(idx)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    idx <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
                </button>
                {idx < campaignSteps.length - 1 && (
                  <div className={`w-8 h-1 ${idx < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Step 1: Campaign Details */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>Set up your campaign name, objective, and budget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name</label>
                    <input
                      type="text"
                      value={formData.campaignName}
                      onChange={(e) => handleInputChange('campaignName', e.target.value)}
                      placeholder="e.g., Summer Product Launch"
                      className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Campaign Objective</label>
                    <div className="grid grid-cols-2 gap-3">
                      {campaignObjectives.map((obj) => (
                        <button
                          key={obj.value}
                          onClick={() => handleInputChange('campaignObjective', obj.value)}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            formData.campaignObjective === obj.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-muted hover:border-primary/50'
                          }`}
                        >
                          <p className="font-semibold">{obj.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Budget Type</label>
                      <select
                        value={formData.budgetType}
                        onChange={(e) => handleInputChange('budgetType', e.target.value)}
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                      >
                        <option value="daily">Daily Budget</option>
                        <option value="lifetime">Lifetime Budget</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {formData.budgetType === 'daily' ? 'Daily Budget' : 'Total Budget'} ($)
                      </label>
                      <input
                        type="number"
                        value={formData.budgetType === 'daily' ? formData.dailyBudget : formData.totalBudget}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (formData.budgetType === 'daily') {
                            handleInputChange('dailyBudget', value)
                          } else {
                            handleInputChange('totalBudget', value)
                          }
                        }}
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Audience Targeting */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Audience Targeting</CardTitle>
                  <CardDescription>Define your target audience demographics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Age</label>
                      <input
                        type="number"
                        value={formData.targetAudience.ageMin}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          targetAudience: { ...prev.targetAudience, ageMin: parseInt(e.target.value) }
                        }))}
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Age</label>
                      <input
                        type="number"
                        value={formData.targetAudience.ageMax}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          targetAudience: { ...prev.targetAudience, ageMax: parseInt(e.target.value) }
                        }))}
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Gender</label>
                      <select
                        value={formData.targetAudience.gender}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          targetAudience: { ...prev.targetAudience, gender: e.target.value as any }
                        }))}
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                      >
                        <option value="all">All</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Interest Topics</label>
                    <div className="flex flex-wrap gap-2">
                      {['Technology', 'Fashion', 'Sports', 'Travel', 'Food', 'Fitness'].map((interest) => (
                        <button
                          key={interest}
                          onClick={() => {
                            const interests = formData.targetAudience.interests || []
                            if (interests.includes(interest)) {
                              setFormData(prev => ({
                                ...prev,
                                targetAudience: { 
                                  ...prev.targetAudience, 
                                  interests: interests.filter(i => i !== interest)
                                }
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                targetAudience: { 
                                  ...prev.targetAudience, 
                                  interests: [...interests, interest]
                                }
                              }))
                            }
                          }}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                            formData.targetAudience.interests?.includes(interest)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-muted hover:border-primary/50'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Ad Groups */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Ad Groups</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Ad Group
                </button>
              </div>

              {formData.adGroups.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">No ad groups created yet</p>
                    <button className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                      <Plus className="w-4 h-4" />
                      Create First Ad Group
                    </button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.adGroups.map((group) => (
                    <Card key={group.id} className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Budget: ${group.dailyBudget}/day</span>
                              <span>Bidding: {biddingStrategies.find(s => s.value === group.biddingStrategy)?.label}</span>
                            </div>
                          </div>
                          <Badge className={group.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {group.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Creative & Catalogs */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Creative Assets</CardTitle>
                  <CardDescription>Add videos and creative content for your ads</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">Creative upload interface</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Product Catalogs</CardTitle>
                  <CardDescription>Select catalogs to use for dynamic product ads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Electronics & Tech', products: 3 },
                    { name: 'Accessories', products: 3 },
                  ].map((catalog) => (
                    <div key={catalog.name} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <input type="checkbox" className="w-5 h-5" />
                      <div className="flex-1">
                        <p className="font-medium">{catalog.name}</p>
                        <p className="text-sm text-muted-foreground">{catalog.products} products</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Review & Launch */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                  <CardDescription>Review your campaign before launching</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Campaign Name</p>
                      <p className="font-semibold text-lg">{formData.campaignName || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Objective</p>
                      <p className="font-semibold text-lg capitalize">{formData.campaignObjective}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold text-lg">
                        ${formData.budgetType === 'daily' ? formData.dailyBudget : formData.totalBudget}/
                        {formData.budgetType === 'daily' ? 'day' : 'total'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ad Groups</p>
                      <p className="font-semibold text-lg">{formData.adGroups.length}</p>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Launch Campaign
                  </button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-card border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {campaignSteps.length}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStep === campaignSteps.length - 1}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {currentStep === campaignSteps.length - 1 ? 'Complete' : 'Next'}
            {currentStep < campaignSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
