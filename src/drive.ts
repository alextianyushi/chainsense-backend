// src/api/drive.ts

import { createAutoDriveApi, uploadFile, downloadFile } from '@autonomys/auto-drive';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Initialize Auto Drive API with API key from .env
const api = createAutoDriveApi({ apiKey: process.env.AUTODRIVE_API_KEY! });

/**
 * Upload a file from memory in GenericFile format
 * @param content The file content as a JSON object
 * @param filename The name of the file to be uploaded
 * @param password Optional encryption password
 * @returns The CID of the uploaded file
 */
export async function uploadFileFromMemory(content: object, filename: string, password?: string): Promise<string> {
  const buffer = Buffer.from(JSON.stringify(content, null, 2), 'utf-8'); // Convert content to Buffer as JSON
  const genericFile = {
    read: async function* () {
      yield buffer;
    },
    name: filename,
    mimeType: 'application/json', // MIME type for JSON files
    size: buffer.length,
    path: filename,
  };

  const options = {
    password,
    compression: true,
    onProgress: (progress: number) => {
      console.log(`Upload progress: ${progress}%`);
    },
  };

  try {
    const cid = await uploadFile(api, genericFile, options);
    console.log(`File uploaded successfully. CID: ${cid}`);
    return cid;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}

/**
 * Download a file from Auto Drive using CID
 * @param cid The CID of the file to download
 * @param password Optional decryption password
 * @returns The file content as a string or JSON object
 */
export async function downloadFileFromAutoDrive(cid: string, password?: string): Promise<object | string> {
  try {
    const stream = await downloadFile(api, cid, password);
    let fileBuffer = Buffer.alloc(0);

    for await (const chunk of stream) {
      fileBuffer = Buffer.concat([fileBuffer, chunk]);
    }

    console.log('File downloaded successfully.');

    const fileContent = fileBuffer.toString('utf-8');
    try {
      // Attempt to parse as JSON
      return JSON.parse(fileContent);
    } catch {
      // Fallback to plain text if not valid JSON
      return fileContent;
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}






