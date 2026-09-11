'use client'

import { Navigation } from '@/components/Navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function WorkspaceFeaturePage({ title, description, actions }: { title: string; description: string; actions: string[] }) {
  return (
    <ProtectedRoute>
      <Navigation />
      <main className="min-h-screen bg-background px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {actions.map((action) => (
              <Card key={action}>
                <CardHeader><CardTitle className="text-base">{action}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Review activity, manage settings, and keep your team moving.</p></CardContent>
              </Card>
            ))}
          </div>
          <Button asChild variant="outline" className="w-fit"><Link href="/accounts">View all accounts</Link></Button>
        </div>
      </main>
    </ProtectedRoute>
  )
}
