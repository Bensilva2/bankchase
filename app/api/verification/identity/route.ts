import { NextRequest, NextResponse } from 'next/server'
import { IdentityMatchingService } from '@/lib/identity-matching'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, providedData, storedDataId } = body

    // Fetch stored identity data
    const { data: storedData, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', storedDataId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Perform identity verification
    const result = await IdentityMatchingService.verifyIdentity(
      userId,
      providedData,
      {
        ssn: storedData.ssn,
        firstName: storedData.first_name,
        lastName: storedData.last_name,
        dateOfBirth: storedData.date_of_birth,
        address: storedData.address,
        city: storedData.city,
        state: storedData.state,
        zipCode: storedData.zip_code,
        phone: storedData.phone,
      }
    )

    // Save verification method if successful
    if (result.overall_match) {
      await supabase.from('verification_methods').insert({
        user_id: userId,
        method_type: 'identity_match',
        status: 'verified',
        verified_at: new Date().toISOString(),
        metadata: { match_score: result.overall_score },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Identity verification error:', error)
    return NextResponse.json(
      { error: 'Identity verification failed' },
      { status: 500 }
    )
  }
}
