import React from 'react'
import { getWorkflowRuns, getEmailLogs } from '@/app/actions/onboarding'
import { BarChart3, Mail, Zap, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Admin Dashboard - BankChase',
  description: 'Monitor workflows, emails, and onboarding metrics',
}

export default async function AdminDashboard() {
  const [workflows, emails] = await Promise.all([
    getWorkflowRuns(20),
    getEmailLogs(20),
  ])

  const completedWorkflows = workflows.filter((w) => w.status === 'completed').length
  const failedWorkflows = workflows.filter((w) => w.status === 'failed').length
  const sentEmails = emails.filter((e) => e.status === 'sent').length

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your onboarding system, workflows, and email logs
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Workflows
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {workflows.length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-primary">
                  {completedWorkflows}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Emails
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {emails.length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-accent opacity-20" />
            </div>
          </Card>

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Success Rate
                </p>
                <p className="text-3xl font-bold text-primary">
                  {workflows.length > 0
                    ? Math.round((completedWorkflows / workflows.length) * 100)
                    : 0}
                  %
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Recent Workflows */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recent Workflows</h2>
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Workflow ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.length > 0 ? (
                    workflows.map((workflow) => (
                      <tr
                        key={workflow.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-mono text-foreground">
                          {workflow.id.substring(0, 12)}...
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              workflow.status === 'completed'
                                ? 'bg-primary/20 text-primary'
                                : workflow.status === 'failed'
                                  ? 'bg-destructive/20 text-destructive'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {workflow.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {workflow.startedAt
                            ? new Date(workflow.startedAt).toLocaleString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {workflow.completedAt
                            ? new Date(workflow.completedAt).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No workflows yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Emails */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Emails</h2>
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {emails.length > 0 ? (
                    emails.map((email) => (
                      <tr
                        key={email.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-foreground">
                          {email.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {email.type}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              email.status === 'sent'
                                ? 'bg-primary/20 text-primary'
                                : email.status === 'failed'
                                  ? 'bg-destructive/20 text-destructive'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {email.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {email.sentAt
                            ? new Date(email.sentAt).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No emails sent yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
