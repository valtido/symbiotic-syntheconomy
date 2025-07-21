// Import necessary dependencies
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// Define interfaces for request and response data
interface ArtGenerationRequest {
  prompt: string;
  style?: string;
  dimensions?: { width: number; height: number };
  culturalContext?: string;
}

interface ArtGenerationResponse {
  imageUrl: string;
  metadata: {
    prompt: string;
    style: string;
    dimensions: { width: number; height: number };
    timestamp: string;
  };
}

class ArtGenerationService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/images/generations';
  private localStoragePath: string = path.join(__dirname, '../../storage/art');

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Ensure storage directory exists
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.localStoragePath, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage directory:', error);
    }
  }

  /**
   * Generate ritual art based on provided parameters
   * @param request Art generation parameters
   * @returns Generated art information
   */
  async generateRitualArt(request: ArtGenerationRequest): Promise<ArtGenerationResponse> {
    try {
      const { prompt, style = 'digital art', dimensions = { width: 1024, height: 1024 }, culturalContext } = request;
      
      // Construct detailed prompt with cultural context if provided
      let fullPrompt = `Create a ritual visualization: ${prompt}, in the style of ${style}`;
      if (culturalContext) {
        fullPrompt += `, inspired by ${culturalContext} cultural elements`;
      }

      // Make API call to generate image (using OpenAI's DALL-E as example)
      const response = await axios.post(
        this.baseUrl,
        {
          prompt: fullPrompt,
          n: 1,
          size: `${dimensions.width}x${dimensions.height}`,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const imageUrl = response.data.data[0].url;
      const timestamp = new Date().toISOString();

      // Save metadata locally
      await this.saveArtMetadata({
        imageUrl,
        metadata: {
          prompt,
          style,
          dimensions,
          timestamp,
        },
      });

      return {
        imageUrl,
        metadata: {
          prompt,
          style,
          dimensions,
          timestamp,
        },
      };
    } catch (error) {
      console.error('Error generating ritual art:', error);
      throw new Error(`Art generation failed: ${error.message}`);
    }
  }

  /**
   * Save art metadata to local storage
   * @param artData Art generation response data
   */
  private async saveArtMetadata(artData: ArtGenerationResponse): Promise<void> {
    try {
      const fileName = `art_${artData.metadata.timestamp.replace(/[:.]/g, '-')}.json`;
      const filePath = path.join(this.localStoragePath, fileName);
      await fs.writeFile(filePath, JSON.stringify(artData, null, 2));
    } catch (error) {
      console.error('Failed to save art metadata:', error);
    }
  }

  /**
   * Retrieve list of generated art metadata
   * @returns List of art metadata files
   */
  async getGeneratedArtList(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.localStoragePath);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Failed to list generated art:', error);
      return [];
    }
  }

  /**
   * Get specific art metadata by filename
   * @param fileName Metadata filename
   * @returns Art metadata
   */
  async getArtMetadata(fileName: string): Promise<ArtGenerationResponse | null> {
    try {
      const filePath = path.join(this.localStoragePath, fileName);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read art metadata:', error);
      return null;
    }
  }
}

export default ArtGenerationService;
