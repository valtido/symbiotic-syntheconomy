import axios from 'axios';
import { createReadStream, createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

// IPFS API endpoint (can be configured for local or remote IPFS nodes)
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://localhost:5001/api/v0';

/**
 * IPFS Service to handle ritual metadata storage and retrieval
 */
export class IPFSService {
  private apiUrl: string;

  constructor(apiUrl: string = IPFS_API_URL) {
    this.apiUrl = apiUrl;
  }

  /**
   * Uploads metadata to IPFS and returns the hash
   * @param metadata - The metadata object to upload
   * @returns The IPFS hash (CID) of the uploaded metadata
   * @throws Error if upload fails
   */
  async uploadMetadata(metadata: Record<string, any>): Promise<string> {
    try {
      // Convert metadata to JSON string
      const metadataString = JSON.stringify(metadata);
      const metadataBuffer = Buffer.from(metadataString);

      // Prepare form data for IPFS API
      const formData = new FormData();
      formData.append('file', metadataBuffer, { filename: 'metadata.json' });

      // Post to IPFS API
      const response = await axios.post(`${this.apiUrl}/add`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (!response.data || !response.data.Hash) {
        throw new Error('Failed to get IPFS hash from response');
      }

      return response.data.Hash;
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Retrieves metadata from IPFS using the provided hash
   * @param hash - The IPFS hash (CID) of the metadata
   * @returns The metadata object
   * @throws Error if retrieval fails
   */
  async getMetadata(hash: string): Promise<Record<string, any>> {
    try {
      const response = await axios.post(`${this.apiUrl}/cat`, null, {
        params: { arg: hash },
      });

      if (!response.data) {
        throw new Error('Failed to retrieve metadata from IPFS');
      }

      // Parse the retrieved data as JSON
      return JSON.parse(response.data.toString());
    } catch (error) {
      console.error('Error retrieving metadata from IPFS:', error);
      throw new Error(`IPFS retrieval failed: ${error.message}`);
    }
  }

  /**
   * Validates if a given IPFS hash exists and is accessible
   * @param hash - The IPFS hash (CID) to validate
   * @returns Boolean indicating if the hash is valid and accessible
   */
  async validateHash(hash: string): Promise<boolean> {
    try {
      await axios.post(`${this.apiUrl}/object/stat`, null, {
        params: { arg: hash },
      });
      return true;
    } catch (error) {
      console.error('Error validating IPFS hash:', error);
      return false;
    }
  }
}

// Export a singleton instance of the service
export default new IPFSService();
