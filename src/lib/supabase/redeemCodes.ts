/**
 * Redeem Code System
 * 
 * Handles code redemption and badge unlocking
 */

import { supabase } from './client'
import { getCurrentUser } from '@/lib/auth'

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
      .eq('code', code.trim().toUpperCase())
      .single()

    if (codeError || !redeemCodeData) {
      return { success: false, error: 'Invalid code. Please check and try again.' }
    }

    // 2. Validate code: check uses < max_uses
    if (redeemCodeData.uses >= redeemCodeData.max_uses) {
      return { success: false, error: 'This code has reached its maximum redemption limit.' }
    }

    // 3. Check for duplicate redemption
    const { data: existingRedemption, error: redemptionCheckError } = await supabase
      .from('redeemed_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code.trim().toUpperCase())
      .single()

    if (existingRedemption && !redemptionCheckError) {
      return { success: false, error: 'This code has already been redeemed.' }
    }

    // 4. Insert into redeemed_codes
    const { error: insertError } = await supabase
      .from('redeemed_codes')
      .insert({
        user_id: userId,
        code: code.trim().toUpperCase(),
      })

    if (insertError) {
      console.error('[redeemCode] Error inserting redeemed code:', insertError)
      return { success: false, error: 'Failed to redeem code. Please try again.' }
    }

    // 5. Increment uses in redeem_codes
    const { error: updateError } = await supabase
      .from('redeem_codes')
      .update({ uses: redeemCodeData.uses + 1 })
      .eq('code', code.trim().toUpperCase())

    if (updateError) {
      console.error('[redeemCode] Error updating code uses:', updateError)
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
        console.error('[redeemCode] Error unlocking badge:', badgeError)
        return { success: false, error: 'Code redeemed but failed to unlock badge. Please contact support.' }
      }

      badgeUnlocked = 'pokeverse_member'
    }

    return { success: true, badgeUnlocked }
  } catch (err) {
    console.error('[redeemCode] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
