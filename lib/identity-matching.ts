import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface IdentityData {
  ssn?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
}

export interface MatchResult {
  field: string
  provided: string
  stored: string
  score: number
  matched: boolean
}

export class IdentityMatchingService {
  // Levenshtein distance for fuzzy matching
  private static levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[len2][len1]
  }

  // Calculate similarity score between 0-1
  private static calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1
    const distance = this.levenshteinDistance(str1, str2)
    return 1 - distance / maxLen
  }

  // Normalize strings for comparison
  private static normalize(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '')
  }

  // Verify SSN format
  private static verifySsn(ssn: string): boolean {
    const ssn9 = ssn.replace(/\D/g, '')
    if (ssn9.length !== 9) return false
    if (ssn9 === '000000000') return false
    if (ssn9.slice(0, 3) === '000') return false
    if (ssn9.slice(3, 5) === '00') return false
    if (ssn9.slice(5) === '0000') return false
    return true
  }

  // Verify DOB format (YYYY-MM-DD)
  private static verifyDob(dob: string): boolean {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dobRegex.test(dob)) return false
    const date = new Date(dob)
    return date instanceof Date && !isNaN(date.getTime())
  }

  // Match SSN fields
  private static matchSsn(provided: string, stored: string, threshold: number = 0.95): MatchResult {
    const providedClean = provided.replace(/\D/g, '')
    const storedClean = stored.replace(/\D/g, '')
    const match = providedClean === storedClean

    return {
      field: 'ssn',
      provided: `***-**-${providedClean.slice(-4)}`,
      stored: `***-**-${storedClean.slice(-4)}`,
      score: match ? 1 : 0,
      matched: match,
    }
  }

  // Match name fields
  private static matchName(
    providedFirst: string,
    providedLast: string,
    storedFirst: string,
    storedLast: string,
    threshold: number = 0.85
  ): MatchResult {
    const firstScore = this.calculateSimilarity(
      this.normalize(providedFirst),
      this.normalize(storedFirst)
    )
    const lastScore = this.calculateSimilarity(
      this.normalize(providedLast),
      this.normalize(storedLast)
    )
    const averageScore = (firstScore + lastScore) / 2

    return {
      field: 'name',
      provided: `${providedFirst} ${providedLast}`,
      stored: `${storedFirst} ${storedLast}`,
      score: averageScore,
      matched: averageScore >= threshold,
    }
  }

  // Match address fields
  private static matchAddress(
    provided: { address: string; city: string; state: string; zipCode: string },
    stored: { address: string; city: string; state: string; zipCode: string },
    threshold: number = 0.80
  ): MatchResult {
    const addressScore = this.calculateSimilarity(
      this.normalize(provided.address),
      this.normalize(stored.address)
    )
    const cityScore = this.calculateSimilarity(
      this.normalize(provided.city),
      this.normalize(stored.city)
    )
    const stateMatch = provided.state.toUpperCase() === stored.state.toUpperCase() ? 1 : 0
    const zipMatch = provided.zipCode === stored.zipCode ? 1 : 0

    const averageScore = (addressScore + cityScore + stateMatch + zipMatch) / 4

    return {
      field: 'address',
      provided: `${provided.address}, ${provided.city}, ${provided.state} ${provided.zipCode}`,
      stored: `${stored.address}, ${stored.city}, ${stored.state} ${stored.zipCode}`,
      score: averageScore,
      matched: averageScore >= threshold,
    }
  }

  // Match DOB fields
  private static matchDob(provided: string, stored: string): MatchResult {
    const match = provided === stored

    return {
      field: 'dateOfBirth',
      provided,
      stored,
      score: match ? 1 : 0,
      matched: match,
    }
  }

  // Perform full identity verification
  static async verifyIdentity(
    userId: string,
    providedData: IdentityData,
    storedData: IdentityData
  ): Promise<{
    overall_match: boolean
    overall_score: number
    results: MatchResult[]
    details: string
  }> {
    const results: MatchResult[] = []
    const scores: number[] = []

    // Get verification rules
    const { data: rules } = await supabase
      .from('identity_match_rules')
      .select('*')

    // SSN verification
    if (providedData.ssn && storedData.ssn) {
      if (!this.verifySsn(providedData.ssn)) {
        return {
          overall_match: false,
          overall_score: 0,
          results: [],
          details: 'Invalid SSN format',
        }
      }
      const ssnResult = this.matchSsn(providedData.ssn, storedData.ssn)
      results.push(ssnResult)
      scores.push(ssnResult.score)
    }

    // Name verification
    if (providedData.firstName && storedData.firstName && providedData.lastName && storedData.lastName) {
      const nameResult = this.matchName(
        providedData.firstName,
        providedData.lastName,
        storedData.firstName,
        storedData.lastName
      )
      results.push(nameResult)
      scores.push(nameResult.score)
    }

    // DOB verification
    if (providedData.dateOfBirth && storedData.dateOfBirth) {
      if (!this.verifyDob(providedData.dateOfBirth)) {
        return {
          overall_match: false,
          overall_score: 0,
          results: [],
          details: 'Invalid date of birth format',
        }
      }
      const dobResult = this.matchDob(providedData.dateOfBirth, storedData.dateOfBirth)
      results.push(dobResult)
      scores.push(dobResult.score)
    }

    // Address verification
    if (
      providedData.address &&
      storedData.address &&
      providedData.city &&
      storedData.city &&
      providedData.state &&
      storedData.state &&
      providedData.zipCode &&
      storedData.zipCode
    ) {
      const addressResult = this.matchAddress(
        {
          address: providedData.address,
          city: providedData.city,
          state: providedData.state,
          zipCode: providedData.zipCode,
        },
        {
          address: storedData.address,
          city: storedData.city,
          state: storedData.state,
          zipCode: storedData.zipCode,
        }
      )
      results.push(addressResult)
      scores.push(addressResult.score)
    }

    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0
    const allMatched = results.every((r) => r.matched)

    // Record verification attempt
    await supabase.from('verification_analytics').insert({
      user_id: userId,
      method_type: 'identity_match',
      status: allMatched ? 'success' : 'failed',
      duration_seconds: 0,
    })

    return {
      overall_match: allMatched && overallScore >= 0.85,
      overall_score: overallScore,
      results,
      details: allMatched ? 'All identity fields matched' : 'Some identity fields do not match',
    }
  }
}
