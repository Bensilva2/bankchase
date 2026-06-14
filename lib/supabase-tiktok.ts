import { createClient } from '@/utils/supabase/server'
import { TikTokStats, TikTokCampaign, TikTokLead } from './tiktok-data'

export async function getTikTokStats(): Promise<TikTokStats> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('tiktok_stats').select('*').single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error fetching TikTok stats:', error)
    return null
  }
}

export async function getTikTokCampaigns(): Promise<TikTokCampaign[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('tiktok_campaigns').select('*')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching TikTok campaigns:', error)
    return []
  }
}

export async function getTikTokLeads(): Promise<TikTokLead[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('tiktok_leads').select('*').limit(50)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching TikTok leads:', error)
    return []
  }
}

export async function saveTikTokAccount(accountData: {
  accountId: string
  accountName: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
}): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('tiktok_accounts').insert([accountData])

    if (error) throw error
    return true
  } catch (error) {
    console.error('[v0] Error saving TikTok account:', error)
    return false
  }
}

export async function updateTikTokStats(stats: TikTokStats): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('tiktok_stats').upsert([stats])

    if (error) throw error
    return true
  } catch (error) {
    console.error('[v0] Error updating TikTok stats:', error)
    return false
  }
}

export async function createTikTokLead(lead: TikTokLead): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('tiktok_leads').insert([lead])

    if (error) throw error
    return true
  } catch (error) {
    console.error('[v0] Error creating TikTok lead:', error)
    return false
  }
}

export async function updateLeadStatus(leadId: string, status: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('tiktok_leads').update({ status }).eq('id', leadId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[v0] Error updating lead status:', error)
    return false
  }
}
