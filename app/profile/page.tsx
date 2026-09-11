'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBanking } from '@/lib/banking-context'
import { Save, RotateCcw, UserRound } from 'lucide-react'
import { toast } from 'sonner'

function ProfileContent() {
  const { userProfile, isLoaded, updateUserProfile, saveToStorage } = useBanking()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const beginEdit = () => {
    setForm({ name: userProfile.name, email: userProfile.email, phone: userProfile.phone, address: userProfile.address })
    setEditing(true)
  }

  const saveProfile = () => {
    if (!form.name.trim() || !form.email.includes('@')) {
      toast.error('Enter a name and valid email address.')
      return
    }
    setSaving(true)
    updateUserProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim() })
    saveToStorage()
    window.setTimeout(() => { setSaving(false); setEditing(false); toast.success('Profile updated successfully.') }, 350)
  }

  if (!isLoaded) return <main className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading profile...</p></main>

  return <main className="min-h-screen bg-background pb-24 md:pb-8"><div className="max-w-4xl mx-auto p-4 md:p-8">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Chase</p><h1 className="text-4xl font-bold text-foreground mt-2">My profile</h1><p className="text-muted-foreground mt-2">Manage your personal information and contact details.</p></div><div className="size-12 rounded-full bg-primary/10 flex items-center justify-center"><UserRound className="text-primary" aria-hidden="true" /></div></div>
    <section className="mt-8 bg-card border border-border rounded-xl p-6 md:p-8" aria-labelledby="profile-heading"><div className="flex items-center justify-between gap-4"><div><h2 id="profile-heading" className="text-xl font-semibold text-foreground">Personal information</h2><p className="text-sm text-muted-foreground mt-1">Keep your details current for account alerts and verification.</p></div>{!editing && <button onClick={beginEdit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Edit profile</button>}</div>
      {editing ? <div className="mt-8 grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium text-foreground">Full name<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label><label className="grid gap-2 text-sm font-medium text-foreground">Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label><label className="grid gap-2 text-sm font-medium text-foreground">Phone<input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label><label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">Mailing address<textarea rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label><div className="flex gap-3 md:col-span-2"><button onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save changes'}</button><button onClick={() => setEditing(false)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"><RotateCcw className="size-4" aria-hidden="true" />Cancel</button></div></div> : <dl className="mt-8 grid gap-6 md:grid-cols-2">{[['Full name', userProfile.name], ['Email', userProfile.email], ['Phone', userProfile.phone], ['Mailing address', userProfile.address]].map(([label, value]) => <div key={label} className="border-t border-border pt-4"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-2 text-base font-medium text-foreground">{value || 'Not set'}</dd></div>)}</dl>}
    </section>
    <p className="mt-5 text-sm text-muted-foreground">Member since {new Date(userProfile.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
  </div></main>
}

export default function ProfilePage() { return <ProtectedRoute><ProfileContent /></ProtectedRoute> }
