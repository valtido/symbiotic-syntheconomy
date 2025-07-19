import { Ritual, IRitual } from '../models/Ritual';
import { IPFSService } from './IPFSService';
import { BlockchainService } from './BlockchainService';

export interface CreateRitualData {
  name: string;
  bioregionId: string;
  ipfsHash: string;
  transactionHash?: string;
  validation: {
    esepScore: number;
    cedaScore: number;
    isApproved: boolean;
  };
  author?: string;
  authorAddress?: string;
}

export interface UpdateRitualData {
  title?: string;
  description?: string;
  status?: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';
  isApproved?: boolean;
  moderationNotes?: string;
}

export class RitualService {
  private ipfsService: IPFSService;
  private blockchainService: BlockchainService;

  constructor() {
    this.ipfsService = new IPFSService();
    this.blockchainService = new BlockchainService();
  }

  /**
   * Create a new ritual
   */
  async createRitual(data: CreateRitualData): Promise<string> {
    try {
      const ritual = new Ritual({
        title: data.name,
        bioregionId: data.bioregionId,
        author: data.author || 'Anonymous',
        authorAddress:
          data.authorAddress || '0x0000000000000000000000000000000000000000',
        ipfsHash: data.ipfsHash,
        blockchainTxHash: data.transactionHash,
        esepScore: Math.round(data.validation.esepScore * 1000), // Convert to 0-1000 scale
        cedaScore: data.validation.cedaScore,
        narrativeScore: 500, // Default score, will be calculated later
        isApproved: data.validation.isApproved,
        status: data.validation.isApproved ? 'approved' : 'pending',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedRitual = await ritual.save();
      console.log(`✅ Ritual created: ${savedRitual._id}`);

      return savedRitual._id.toString();
    } catch (error) {
      console.error('❌ Error creating ritual:', error);
      throw new Error('Failed to create ritual');
    }
  }

  /**
   * Get ritual by ID
   */
  async getRitualById(id: string): Promise<IRitual | null> {
    try {
      const ritual = await Ritual.findById(id);
      return ritual;
    } catch (error) {
      console.error('❌ Error getting ritual:', error);
      throw new Error('Failed to get ritual');
    }
  }

  /**
   * Get rituals by bioregion
   */
  async getRitualsByBioregion(
    bioregionId: string,
    limit = 20,
    offset = 0,
  ): Promise<IRitual[]> {
    try {
      const rituals = await Ritual.find({ bioregionId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return rituals;
    } catch (error) {
      console.error('❌ Error getting rituals by bioregion:', error);
      throw new Error('Failed to get rituals');
    }
  }

  /**
   * Get rituals by author
   */
  async getRitualsByAuthor(
    authorAddress: string,
    limit = 20,
    offset = 0,
  ): Promise<IRitual[]> {
    try {
      const rituals = await Ritual.find({ authorAddress })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return rituals;
    } catch (error) {
      console.error('❌ Error getting rituals by author:', error);
      throw new Error('Failed to get rituals');
    }
  }

  /**
   * Update ritual
   */
  async updateRitual(
    id: string,
    data: UpdateRitualData,
  ): Promise<IRitual | null> {
    try {
      const ritual = await Ritual.findByIdAndUpdate(
        id,
        {
          ...data,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (ritual) {
        console.log(`✅ Ritual updated: ${id}`);
      }

      return ritual;
    } catch (error) {
      console.error('❌ Error updating ritual:', error);
      throw new Error('Failed to update ritual');
    }
  }

  /**
   * Approve ritual
   */
  async approveRitual(
    id: string,
    moderatorId: string,
  ): Promise<IRitual | null> {
    try {
      const ritual = await Ritual.findByIdAndUpdate(
        id,
        {
          isApproved: true,
          status: 'approved',
          moderatedBy: moderatorId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (ritual) {
        console.log(`✅ Ritual approved: ${id}`);

        // Update blockchain if needed
        if (ritual.blockchainTxHash) {
          await this.blockchainService.updateRitualStatus(
            ritual.blockchainTxHash,
            true,
          );
        }
      }

      return ritual;
    } catch (error) {
      console.error('❌ Error approving ritual:', error);
      throw new Error('Failed to approve ritual');
    }
  }

  /**
   * Reject ritual
   */
  async rejectRitual(
    id: string,
    moderatorId: string,
    reason: string,
  ): Promise<IRitual | null> {
    try {
      const ritual = await Ritual.findByIdAndUpdate(
        id,
        {
          isApproved: false,
          status: 'rejected',
          moderatedBy: moderatorId,
          moderationNotes: reason,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (ritual) {
        console.log(`❌ Ritual rejected: ${id}`);
      }

      return ritual;
    } catch (error) {
      console.error('❌ Error rejecting ritual:', error);
      throw new Error('Failed to reject ritual');
    }
  }

  /**
   * Get ritual statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const stats = await Ritual.aggregate([
        {
          $group: {
            _id: null,
            totalRituals: { $sum: 1 },
            approvedRituals: {
              $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] },
            },
            rejectedRituals: {
              $sum: { $cond: [{ $eq: ['$isApproved', false] }, 1, 0] },
            },
            averageEsepScore: { $avg: '$esepScore' },
            averageCedaScore: { $avg: '$cedaScore' },
            averageNarrativeScore: { $avg: '$narrativeScore' },
            totalViews: { $sum: '$views' },
            totalLikes: { $sum: '$likes' },
          },
        },
      ]);

      const bioregionStats = await Ritual.aggregate([
        {
          $group: {
            _id: '$bioregionId',
            count: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] },
            },
            averageScore: { $avg: '$esepScore' },
          },
        },
      ]);

      return {
        overall: stats[0] || {
          totalRituals: 0,
          approvedRituals: 0,
          rejectedRituals: 0,
          averageEsepScore: 0,
          averageCedaScore: 0,
          averageNarrativeScore: 0,
          totalViews: 0,
          totalLikes: 0,
        },
        byBioregion: bioregionStats,
      };
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      throw new Error('Failed to get statistics');
    }
  }

  /**
   * Search rituals
   */
  async searchRituals(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<IRitual[]> {
    try {
      const rituals = await Ritual.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return rituals;
    } catch (error) {
      console.error('❌ Error searching rituals:', error);
      throw new Error('Failed to search rituals');
    }
  }

  /**
   * Increment ritual views
   */
  async incrementViews(id: string): Promise<void> {
    try {
      await Ritual.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } catch (error) {
      console.error('❌ Error incrementing views:', error);
    }
  }

  /**
   * Like/unlike ritual
   */
  async toggleLike(
    id: string,
    userId: string,
  ): Promise<{ liked: boolean; likes: number }> {
    try {
      // This is a simplified implementation
      // In a real app, you'd track individual user likes
      const ritual = await Ritual.findByIdAndUpdate(
        id,
        { $inc: { likes: 1 } },
        { new: true },
      );

      return {
        liked: true,
        likes: ritual?.likes || 0,
      };
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      throw new Error('Failed to toggle like');
    }
  }

  /**
   * Get recent rituals
   */
  async getRecentRituals(limit = 10): Promise<IRitual[]> {
    try {
      const rituals = await Ritual.find({ isApproved: true })
        .sort({ createdAt: -1 })
        .limit(limit);

      return rituals;
    } catch (error) {
      console.error('❌ Error getting recent rituals:', error);
      throw new Error('Failed to get recent rituals');
    }
  }

  /**
   * Get trending rituals
   */
  async getTrendingRituals(limit = 10): Promise<IRitual[]> {
    try {
      const rituals = await Ritual.find({ isApproved: true })
        .sort({ likes: -1, views: -1 })
        .limit(limit);

      return rituals;
    } catch (error) {
      console.error('❌ Error getting trending rituals:', error);
      throw new Error('Failed to get trending rituals');
    }
  }
}
