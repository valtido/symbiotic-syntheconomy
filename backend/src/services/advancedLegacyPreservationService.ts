import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { StorageService } from './storageService';
import { AIService } from './aiService';
import { BlockchainService } from './blockchainService';

interface CulturalArtifact {
  id: string;
  title: string;
  description: string;
  type: 'oral_history' | 'ritual' | 'artifact' | 'story';
  content: string | Buffer;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  communityId: string;
  blockchainHash?: string;
  aiAnalysis?: Record<string, any>;
}

interface KnowledgeTransferSession {
  id: string;
  title: string;
  participants: string[];
  artifacts: string[];
  recordingUrl?: string;
  transcript?: string;
  createdAt: Date;
}

@injectable()
export class AdvancedLegacyPreservationService {
  private culturalMemoryBank: Map<string, CulturalArtifact> = new Map();
  private knowledgeSessions: Map<string, KnowledgeTransferSession> = new Map();

  constructor(
    @inject(StorageService) private storageService: StorageService,
    @inject(AIService) private aiService: AIService,
    @inject(BlockchainService) private blockchainService: BlockchainService
  ) {}

  /**
   * Record and preserve oral history or cultural ritual
   */
  async recordCulturalArtifact(
    title: string,
    description: string,
    type: CulturalArtifact['type'],
    content: string | Buffer,
    creatorId: string,
    communityId: string,
    metadata: Record<string, any> = {}
  ): Promise<CulturalArtifact> {
    const id = uuidv4();
    const now = new Date();

    const artifact: CulturalArtifact = {
      id,
      title,
      description,
      type,
      content,
      metadata,
      createdAt: now,
      updatedAt: now,
      creatorId,
      communityId
    };

    // Store content in persistent storage
    const storageUrl = await this.storageService.uploadContent(id, content);
    artifact.content = storageUrl;

    // Generate blockchain hash for authenticity
    const contentHash = this.generateContentHash(content);
    const blockchainHash = await this.blockchainService.recordHash(contentHash);
    artifact.blockchainHash = blockchainHash;

    // Perform AI analysis for cultural patterns and metadata enrichment
    const aiAnalysis = await this.aiService.analyzeCulturalContent(content, type);
    artifact.aiAnalysis = aiAnalysis;

    this.culturalMemoryBank.set(id, artifact);
    return artifact;
  }

  /**
   * Retrieve cultural artifact by ID with verification
   */
  async getCulturalArtifact(id: string): Promise<CulturalArtifact | undefined> {
    const artifact = this.culturalMemoryBank.get(id);
    if (artifact && artifact.blockchainHash) {
      const isValid = await this.blockchainService.verifyHash(artifact.blockchainHash);
      if (!isValid) {
        throw new Error('Artifact authenticity verification failed');
      }
    }
    return artifact;
  }

  /**
   * Facilitate intergenerational knowledge transfer session
   */
  async createKnowledgeTransferSession(
    title: string,
    participants: string[],
    artifacts: string[]
  ): Promise<KnowledgeTransferSession> {
    const id = uuidv4();
    const session: KnowledgeTransferSession = {
      id,
      title,
      participants,
      artifacts,
      createdAt: new Date()
    };

    this.knowledgeSessions.set(id, session);
    return session;
  }

  /**
   * Upload recording and transcript for knowledge session
   */
  async uploadSessionRecording(
    sessionId: string,
    recording: Buffer,
    transcript?: string
  ): Promise<KnowledgeTransferSession | undefined> {
    const session = this.knowledgeSessions.get(sessionId);
    if (session) {
      const recordingUrl = await this.storageService.uploadContent(sessionId, recording);
      session.recordingUrl = recordingUrl;
      if (transcript) {
        session.transcript = transcript;
      }
      // Analyze recording with AI for cultural insights
      const analysis = await this.aiService.analyzeCulturalContent(recording, 'oral_history');
      // Optionally store analysis in session metadata
      return session;
    }
    return undefined;
  }

  /**
   * Generate content hash for blockchain verification
   */
  private generateContentHash(content: string | Buffer): string {
    return createHash('sha256')
      .update(typeof content === 'string' ? content : content.toString('base64'))
      .digest('hex');
  }

  /**
   * Search cultural memory bank with AI-powered query
   */
  async searchCulturalMemory(query: string): Promise<CulturalArtifact[]> {
    const aiResults = await this.aiService.searchCulturalPatterns(query);
    const results: CulturalArtifact[] = [];

    for (const artifact of this.culturalMemoryBank.values()) {
      if (aiResults.relevantIds.includes(artifact.id)) {
        results.push(artifact);
      }
    }
    return results;
  }

  /**
   * Generate multi-generational story from artifacts
   */
  async generateMultiGenerationalStory(artifactIds: string[]): Promise<string> {
    const artifacts = artifactIds
      .map(id => this.culturalMemoryBank.get(id))
      .filter(Boolean) as CulturalArtifact[];

    if (artifacts.length === 0) {
      throw new Error('No valid artifacts found for story generation');
    }

    const storyContent = await this.aiService.generateNarrative(artifacts);
    return storyContent;
  }
}
