import { supabase } from './client'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']

/**
 * Upload profile picture to Supabase Storage
 * 
 * @param userId - The user's ID
 * @param file - The image file to upload
 * @returns Public URL of the uploaded avatar or error
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        url: null,
        error: new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'),
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        url: null,
        error: new Error('File size exceeds 2MB limit.'),
      }
    }

    // Upload to Supabase Storage
    // Path: avatars/{user_id}/avatar.png
    const filePath = `${userId}/avatar.png`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        upsert: true, // Replace existing file
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return {
        url: null,
        error: uploadError,
      }
    }

    // Get public URL
    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath)

    if (!data?.publicUrl) {
      return {
        url: null,
        error: new Error('Failed to get public URL for uploaded avatar'),
      }
    }

    return {
      url: data.publicUrl,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error uploading avatar:', err)
    return {
      url: null,
      error: err as Error,
    }
  }
}

/**
 * Delete avatar from Supabase Storage
 * 
 * @param userId - The user's ID
 */
export async function deleteAvatar(userId: string): Promise<{ error: Error | null }> {
  try {
    const filePath = `${userId}/avatar.png`

    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Error deleting avatar:', error)
      return { error }
    }

    return { error: null }
  } catch (err) {
    console.error('Unexpected error deleting avatar:', err)
    return { error: err as Error }
  }
}

/**
 * Get avatar URL for a user
 * 
 * @param userId - The user's ID
 * @returns Public URL of the avatar or null if not found
 */
export function getAvatarUrl(userId: string): string | null {
  const filePath = `${userId}/avatar.png`
  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath)

  return data?.publicUrl || null
}
