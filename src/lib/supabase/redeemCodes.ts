/**
 * Redeem Code System
 * 
 * Handles code redemption and badge unlocking
 */

import { supabase } from './client'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

export interface RedeemCode {
  code: string
  badge_type: string
  max_uses: number
  uses: number
}

export interface RedeemedCode {
  user_id: string
  code: string
  redeemed_at?: Date
}

/**
 * Redeem a code and unlock badge if applicable
 */
export async function redeemCode(code: string): Promise<{ 
  success: boolean
  error?: string
  badgeUnlocked?: string
}> {
  try {
    // Normalize code: trim whitespace and convert to uppercase
    const normalizedCode = code.trim().toUpperCase()

    // Validate code format: 3-32 characters, alphanumeric, underscores, or hyphens
    if (!/^[A-Z0-9_-]{3,32}$/.test(normalizedCode)) {
      return { success: false, error: 'Invalid code format. Codes must be 3-32 characters and contain only letters, numbers, underscores, or hyphens.' }
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return { success: false, error: 'You must be logged in to redeem codes.' }
    }

    const userId = user.id

    // 1. Query redeem_codes table
    const { data: redeemCodeData, error: codeError } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    // Handle query errors - distinguish between "not found" and other errors
    if (codeError) {
      const errorCode = (codeError as any)?.code
      // PGRST116 is the error code for "no rows returned" when using .single()
      if (errorCode === 'PGRST116' || codeError.message?.includes('No rows')) {
        // Code not found - this is an invalid code
        return { success: false, error: 'Invalid code' }
      } else {
        // Other error (RLS, network, etc.) - don't treat as invalid code
        logger.error('Query error validating redeem code')
        return { success: false, error: 'Unable to validate code right now. Please try again.' }
      }
    }

    // No error but also no data (shouldn't happen with .single(), but defensive check)
    if (!redeemCodeData) {
      return { success: false, error: 'Invalid code' }
    }

    // 2. Validate code: check uses < max_uses
    if (redeemCodeData.uses >= redeemCodeData.max_uses) {
      return { success: false, error: 'This code has reached its maximum redemption limit.' }
    }

    // 3. Check for duplicate redemption
    // Use .maybeSingle() instead of .single() to handle missing rows gracefully
    const { data: existingRedemption, error: redemptionCheckError } = await supabase
      .from('redeemed_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', normalizedCode)
      .maybeSingle()

    // Only treat as error if there's an actual error (not a missing row)
    // If redemptionCheckError exists and it's not a "not found" type error, that's a real problem
    if (redemptionCheckError) {
      // Check if it's a PGRST error code for "not found" (PGRST116) or similar
      // For Supabase, missing rows typically return null data without error
      // But if there's an actual error (like RLS policy issue), log it
      const errorCode = (redemptionCheckError as any)?.code
      if (errorCode && errorCode !== 'PGRST116') {
        logger.error('Error checking for existing redemption')
        // Continue anyway - if we can't check, we'll try to insert and let that fail if duplicate
      }
    }

    // If a redemption exists, block the redemption
    if (existingRedemption) {
      return { success: false, error: 'This code has already been redeemed.' }
    }

    // 4. Insert into redeemed_codes
    const { error: insertError } = await supabase
      .from('redeemed_codes')
      .insert({
        user_id: userId,
        code: normalizedCode,
      })

    if (insertError) {
      logger.error('Error inserting redeemed code')
      return { success: false, error: 'Failed to redeem code. Please try again.' }
    }

    // 5. Increment uses in redeem_codes
    const { error: updateError } = await supabase
      .from('redeem_codes')
      .update({ uses: redeemCodeData.uses + 1 })
      .eq('code', normalizedCode)

    if (updateError) {
      logger.error('Error updating code uses')
      // Don't fail - redemption was successful, just log the error
    }

    // 6. Unlock badge if badge_type = "pokeverse_member"
    let badgeUnlocked: string | undefined
    if (redeemCodeData.badge_type === 'pokeverse_member') {
      const { error: badgeError } = await supabase
        .from('profiles')
        .update({ pokeverse_member: true })
        .eq('id', userId)

      if (badgeError) {
        logger.error('Error unlocking badge')
        return { success: false, error: 'Code redeemed but failed to unlock badge. Please contact support.' }
      }

      badgeUnlocked = 'pokeverse_member'
    }

    return { success: true, badgeUnlocked }
  } catch (err) {
    logger.error('Unexpected error redeeming code')
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
