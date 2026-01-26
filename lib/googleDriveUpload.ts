import { google } from 'googleapis'
import { Readable } from 'stream'

// Google Drive Folder ID where screenshots will be uploaded
const DRIVE_FOLDER_ID = '1MCaMBRZ_ghp0caBcg7TvFM_pOoDwNbaN'

// Initialize Google Drive API
function getGoogleDriveClient() {
  try {
    const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS
    if (!credentials) {
      throw new Error('GOOGLE_DRIVE_CREDENTIALS environment variable not set')
    }

    const auth = new google.auth.GoogleAuth({
      credentials: typeof credentials === 'string' ? JSON.parse(credentials) : credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    })

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
    console.log('[GOOGLE DRIVE] Starting upload:', { fileName, mimeType })

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
    console.error('[GOOGLE DRIVE] Upload failed:', error)
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
