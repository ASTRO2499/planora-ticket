import { google } from 'googleapis'
import { Readable } from 'stream'

// Google Drive Folder ID where screenshots will be uploaded
const DRIVE_FOLDER_ID = '1MCaMBRZ_ghp0caBcg7TvFM_pOoDwNbaN'

/**
 * Safely parse Google Drive credentials from environment variable
 */
function parseGoogleDriveCredentials(credentialsString: string | undefined): any {
  if (!credentialsString) {
    throw new Error('GOOGLE_DRIVE_CREDENTIALS environment variable not set')
  }

  // Log input for debugging
  console.log('[GOOGLE DRIVE] Input credentials type:', typeof credentialsString)
  console.log('[GOOGLE DRIVE] Input credentials length:', credentialsString.length)
  console.log('[GOOGLE DRIVE] First 100 chars:', credentialsString.substring(0, 100))

  if (typeof credentialsString !== 'string') {
    console.log('[GOOGLE DRIVE] Credentials already parsed as object')
    return credentialsString
  }

  const trimmed = credentialsString.trim()
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(trimmed)
    console.log('[GOOGLE DRIVE] Credentials parsed successfully')
    console.log('[GOOGLE DRIVE] Parsed object keys:', Object.keys(parsed))
    return parsed
  } catch (parseError) {
    console.error('[GOOGLE DRIVE] Initial JSON parse failed:', parseError)
    
    // Try alternative: the string might have extra escaping
    try {
      // If it starts with escaped quote, try to unescape
      let unescaped = trimmed
      if (unescaped.startsWith('\\"')) {
        unescaped = unescaped.slice(1, -1)
        console.log('[GOOGLE DRIVE] Removing outer escaped quotes')
      }
      
      const parsed = JSON.parse(unescaped)
      console.log('[GOOGLE DRIVE] Credentials parsed successfully after unescaping')
      console.log('[GOOGLE DRIVE] Parsed object keys:', Object.keys(parsed))
      return parsed
    } catch (secondError) {
      console.error('[GOOGLE DRIVE] Second parse attempt failed:', secondError)
      throw new Error(`Failed to parse GOOGLE_DRIVE_CREDENTIALS: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }
  }
}

// Initialize Google Drive API
function getGoogleDriveClient() {
  try {
    const credentialsString = process.env.GOOGLE_DRIVE_CREDENTIALS
    
    console.log('[GOOGLE DRIVE] Initializing client...')
    
    const credentialsObj = parseGoogleDriveCredentials(credentialsString)

    // Verify required fields
    if (!credentialsObj.type || !credentialsObj.project_id || !credentialsObj.private_key) {
      console.error('[GOOGLE DRIVE] Missing required credential fields:', {
        hasType: !!credentialsObj.type,
        hasProjectId: !!credentialsObj.project_id,
        hasPrivateKey: !!credentialsObj.private_key
      })
      throw new Error('Invalid credentials: missing required fields (type, project_id, or private_key)')
    }

    console.log('[GOOGLE DRIVE] Credentials validated:', {
      type: credentialsObj.type,
      projectId: credentialsObj.project_id,
      clientEmail: credentialsObj.client_email,
      privateKeyLength: credentialsObj.private_key.length
    })

    const auth = new google.auth.GoogleAuth({
      credentials: credentialsObj,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    })

    console.log('[GOOGLE DRIVE] GoogleAuth initialized successfully')
    return google.drive({ version: 'v3', auth })
  } catch (error) {
    console.error('[GOOGLE DRIVE] Error initializing client:', error)
    throw error
  }
}

/**
 * Upload screenshot to Google Drive
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name of the file (e.g., "Name - College.jpg")
 * @param mimeType - The MIME type (e.g., "image/jpeg")
 * @returns The Google Drive file ID and sharing link
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<{ fileId: string; webViewLink: string }> {
  try {
    console.log('[GOOGLE DRIVE] Starting upload:', { fileName, mimeType, bufferSize: fileBuffer.length })

    const drive = getGoogleDriveClient()

    // Create a readable stream from the buffer
    const fileStream = Readable.from(fileBuffer)

    // Upload the file
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: [DRIVE_FOLDER_ID]
      },
      media: {
        mimeType: mimeType,
        body: fileStream
      },
      fields: 'id, webViewLink, name'
    })

    const fileId = response.data.id
    const webViewLink = response.data.webViewLink

    console.log('[GOOGLE DRIVE] Upload successful:', { fileId, fileName, link: webViewLink })

    if (!fileId) {
      throw new Error('No file ID returned from Google Drive')
    }

    return { fileId, webViewLink: webViewLink || '' }
  } catch (error) {
    console.error('[GOOGLE DRIVE] Upload failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Failed to upload to Google Drive: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generate proper filename format
 * @param name - Full name of the person
 * @param college - College/Institution name
 * @param extension - File extension (jpg, png, etc.)
 * @returns Formatted filename
 */
export function generateFileName(name: string, college: string, extension: string = 'jpg'): string {
  // Remove special characters and trim
  const cleanName = name.trim().replace(/[^a-zA-Z0-9\s-]/g, '')
  const cleanCollege = college.trim().replace(/[^a-zA-Z0-9\s-]/g, '')
  
  return `${cleanName} - ${cleanCollege}.${extension}`
}

/**
 * Get file extension from MIME type
 * @param mimeType - The MIME type (e.g., "image/jpeg")
 * @returns The file extension (e.g., "jpg")
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'application/pdf': 'pdf'
  }
  return mimeMap[mimeType] || 'jpg'
}
