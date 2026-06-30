'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
    icon: <RocketIcon className="text-primary" />,
    features: ['Full API surface', 'Open-source', 'Ready to use'],
  },
  {
    id: 'cli',
    title: 'Resend CLI',
    description: 'Command-line interface for email automation',
    icon: <PicaIcon className="text-primary" />,
    features: ['Fast setup', 'Local testing', 'Production ready'],
  },
  {
    id: 'docs',
    title: 'Resend Docs for Agents',
    description: 'Complete documentation for AI integration',
    icon: <ParsleyIcon className="text-primary" />,
    features: ['Comprehensive', 'Updated docs', 'Code samples'],
  },
  {
    id: 'skills',
    title: 'Email Skills for Agents',
    description: 'Pre-built skills for email operations',
    icon: <LeapNewIcon className="text-primary" />,
    features: ['Ready to deploy', 'Customizable', 'Fast integration'],
  },
  {
    id: 'quickstart',
    title: 'Quick Start Guides',
    description: 'Get up and running in minutes',
    icon: <Base44Icon className="text-primary" />,
    features: ['Step-by-step', 'Best practices', 'Examples included'],
  },
  {
    id: 'openclaw',
    title: 'OpenClaw Guide',
    description: 'Advanced agent capabilities and patterns',
    icon: <WildcardIcon className="text-primary" />,
    features: ['Advanced patterns', 'Best practices', 'Deep dive'],
  },
  {
    id: 'chat-sdk',
    title: 'Chat SDK',
    description: 'Build interactive chat experiences',
    icon: <AnythingIcon className="text-primary" />,
    features: ['Real-time', 'Cross-platform', 'Easy integration'],
  },
  {
    id: 'ai-builders',
    title: 'AI Builder Guides',
    description: 'Guides specifically for AI builders',
    icon: <LovableIcon className="text-primary" />,
    features: ['Expert guidance', 'Tutorials', 'Case studies'],
  },
]

export function OnboardingCard() {
  const [selectedStep, setSelectedStep] = useState<string | null>(onboardingSteps[0].id)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const currentStep = onboardingSteps.find(step => step.id === selectedStep)

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
    const currentIndex = onboardingSteps.findIndex(step => step.id === selectedStep)
    if (currentIndex < onboardingSteps.length - 1) {
      setSelectedStep(onboardingSteps[currentIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    const currentIndex = onboardingSteps.findIndex(step => step.id === selectedStep)
    if (currentIndex > 0) {
      setSelectedStep(onboardingSteps[currentIndex - 1].id)
    }
  }

  const progress = Math.round((completedSteps.size / onboardingSteps.length) * 100)

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="bg-card border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Step List */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                AI Onboarding Steps
              </h3>
              <div className="space-y-2">
                {onboardingSteps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStep(step.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      selectedStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{step.title}</span>
                      {completedSteps.has(step.id) && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">Progress</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2">
            {currentStep && (
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {currentStep.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-foreground">
                        {currentStep.title}
                      </h2>
                      <p className="text-muted-foreground mt-1">
                        {currentStep.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Key Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentStep.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Button
                    onClick={() => toggleStepCompletion(currentStep.id)}
                    className="w-full"
                    variant={completedSteps.has(currentStep.id) ? 'default' : 'outline'}
                  >
                    {completedSteps.has(currentStep.id)
                      ? '✓ Step Completed'
                      : 'Mark as Complete'}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={handlePrevious}
                      disabled={selectedStep === onboardingSteps[0].id}
                      variant="outline"
                      className="flex-1"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={selectedStep === onboardingSteps[onboardingSteps.length - 1].id}
                      className="flex-1"
                    >
                      Next
                    </Button>
                  </div>

                  <Button variant="ghost" className="w-full">
                    Learn More →
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
