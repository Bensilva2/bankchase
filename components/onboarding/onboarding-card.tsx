'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle2, Circle, ArrowRight, Zap } from 'lucide-react'
import {
  PicaIcon,
  ParsleyIcon,
  LeapNewIcon,
  Base44Icon,
  RocketIcon,
  WildcardIcon,
  AnythingIcon,
  LovableIcon,
} from './icons'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'mcp-server',
    title: 'Resend MCP Server',
    description: 'Open protocol for standardizing AI agent context',
    icon: <RocketIcon className="w-6 h-6 text-primary" />,
    features: ['Full API surface', 'Open-source', 'Ready to use'],
  },
  {
    id: 'cli',
    title: 'Resend CLI',
    description: 'Command-line interface for email automation',
    icon: <PicaIcon className="w-6 h-6 text-primary" />,
    features: ['Fast setup', 'Local testing', 'Production ready'],
  },
  {
    id: 'docs',
    title: 'Resend Docs for Agents',
    description: 'Complete documentation for AI integration',
    icon: <ParsleyIcon className="w-6 h-6 text-primary" />,
    features: ['Comprehensive', 'Updated docs', 'Code samples'],
  },
  {
    id: 'skills',
    title: 'Email Skills for Agents',
    description: 'Pre-built skills for email operations',
    icon: <LeapNewIcon className="w-6 h-6 text-primary" />,
    features: ['Ready to deploy', 'Customizable', 'Fast integration'],
  },
  {
    id: 'quickstart',
    title: 'Quick Start Guides',
    description: 'Get up and running in minutes',
    icon: <Base44Icon className="w-6 h-6 text-primary" />,
    features: ['Step-by-step', 'Best practices', 'Examples included'],
  },
  {
    id: 'openclaw',
    title: 'OpenClaw Guide',
    description: 'Advanced agent capabilities and patterns',
    icon: <WildcardIcon className="w-6 h-6 text-primary" />,
    features: ['Advanced patterns', 'Best practices', 'Deep dive'],
  },
  {
    id: 'chat-sdk',
    title: 'Chat SDK',
    description: 'Build interactive chat experiences',
    icon: <AnythingIcon className="w-6 h-6 text-primary" />,
    features: ['Real-time', 'Cross-platform', 'Easy integration'],
  },
  {
    id: 'ai-builders',
    title: 'AI Builder Guides',
    description: 'Guides specifically for AI builders',
    icon: <LovableIcon className="w-6 h-6 text-primary" />,
    features: ['Expert guidance', 'Tutorials', 'Case studies'],
  },
]

export function OnboardingCard() {
  const [selectedStep, setSelectedStep] = useState<string | null>(onboardingSteps[0].id)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null)

  const currentStep = onboardingSteps.find(step => step.id === selectedStep)
  const currentIndex = onboardingSteps.findIndex(step => step.id === selectedStep)

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId)
    } else {
      newCompleted.add(stepId)
    }
    setCompletedSteps(newCompleted)
  }

  const handleNext = () => {
    if (currentIndex < onboardingSteps.length - 1) {
      setSelectedStep(onboardingSteps[currentIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedStep(onboardingSteps[currentIndex - 1].id)
    }
  }

  const progress = Math.round((completedSteps.size / onboardingSteps.length) * 100)

  const handleTriggerWorkflow = async () => {
    setIsWorkflowRunning(true)
    try {
      const response = await fetch('/api/onboarding/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.success) {
        setWorkflowRunId(data.workflowRunId)
        toast.success('Onboarding workflow started!', {
          description: `Workflow ID: ${data.workflowRunId}`,
        })
        const allSteps = new Set(onboardingSteps.map(s => s.id))
        setCompletedSteps(allSteps)
      } else {
        toast.error('Failed to start workflow', {
          description: data.error || 'Unknown error',
        })
      }
    } catch (error) {
      toast.error('Error triggering workflow', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsWorkflowRunning(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Progress Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Setup Progress</h2>
            <p className="text-sm text-muted-foreground mt-1">Complete each step to unlock all features</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{progress}%</div>
            <div className="text-xs text-muted-foreground">{completedSteps.size} of {onboardingSteps.length}</div>
          </div>
        </div>
        <div className="w-full bg-card border border-border rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Step List - Sidebar */}
          <div className="lg:col-span-1 border-r border-border bg-card/50 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Setup Steps
            </h3>
            <div className="space-y-2">
              {onboardingSteps.map((step, index) => {
                const isSelected = selectedStep === step.id
                const isCompleted = completedSteps.has(step.id)

                return (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStep(step.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : isCompleted
                          ? 'bg-accent/10 hover:bg-accent/20 text-foreground'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-accent" />
                      ) : (
                        <Circle className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold opacity-70">Step {index + 1}</div>
                        <div className="text-sm font-medium truncate">{step.title}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 p-8">
            {currentStep && (
              <div className="space-y-8">
                {/* Step Header */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      {currentStep.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                          Step {currentIndex + 1} of {onboardingSteps.length}
                        </span>
                        {completedSteps.has(currentStep.id) && (
                          <span className="flex items-center gap-1 text-xs text-accent">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl font-bold text-foreground mb-2">
                        {currentStep.title}
                      </h2>
                      <p className="text-muted-foreground text-lg">
                        {currentStep.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Key Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentStep.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors group"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full group-hover:bg-accent transition-colors" />
                        <span className="text-sm font-medium text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workflow Success Message */}
                {workflowRunId && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">Setup Workflow Complete!</p>
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          Workflow ID: <span className="text-primary font-mono">{workflowRunId}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-6 border-t border-border">
                  <Button
                    onClick={() => toggleStepCompletion(currentStep.id)}
                    className="w-full"
                    size="lg"
                    variant={completedSteps.has(currentStep.id) ? 'default' : 'outline'}
                  >
                    {completedSteps.has(currentStep.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Step Completed
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      variant="outline"
                      size="lg"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={currentIndex === onboardingSteps.length - 1}
                      size="lg"
                      className="gap-2"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleTriggerWorkflow}
                    disabled={isWorkflowRunning || completedSteps.size !== onboardingSteps.length}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    size="lg"
                  >
                    {isWorkflowRunning ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-transparent border-t-current rounded-full animate-spin" />
                        Starting Workflow...
                      </>
                    ) : (
                      <>
                        Complete All & Start Workflow
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
