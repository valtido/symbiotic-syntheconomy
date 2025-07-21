// Community Learning Service for Symbiotic Syntheconomy
// This service handles cultural knowledge sharing and educational content management

import { PrismaClient } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

@injectable()
export class CommunityLearningService {
  constructor(@inject('PrismaClient') private prisma: PrismaClient) {}

  /**
   * Create a new learning resource for cultural knowledge sharing
   * @param userId - ID of the user creating the resource
   * @param data - Learning resource data
   * @returns Created learning resource
   */
  async createLearningResource(
    userId: string,
    data: {
      title: string;
      content: string;
      category: string;
      culturalContext?: string;
      language?: string;
    }
  ) {
    try {
      const resource = await this.prisma.learningResource.create({
        data: {
          title: data.title,
          content: data.content,
          category: data.category,
          culturalContext: data.culturalContext,
          language: data.language,
          authorId: userId,
        },
        include: { author: true },
      });
      return resource;
    } catch (error) {
      throw new Error(`Failed to create learning resource: ${error.message}`);
    }
  }

  /**
   * Get all learning resources with optional filters
   * @param filters - Optional filters for category or language
   * @returns List of learning resources
   */
  async getLearningResources(filters: {
    category?: string;
    language?: string;
  } = {}) {
    try {
      const resources = await this.prisma.learningResource.findMany({
        where: {
          category: filters.category,
          language: filters.language,
        },
        include: { author: true, comments: true },
        orderBy: { createdAt: 'desc' },
      });
      return resources;
    } catch (error) {
      throw new Error(`Failed to fetch learning resources: ${error.message}`);
    }
  }

  /**
   * Get a specific learning resource by ID
   * @param id - Resource ID
   * @returns Learning resource details
   */
  async getLearningResourceById(id: string) {
    try {
      const resource = await this.prisma.learningResource.findUnique({
        where: { id },
        include: { author: true, comments: { include: { author: true } } },
      });

      if (!resource) {
        throw new NotFoundError('Learning resource not found');
      }

      return resource;
    } catch (error) {
      throw new Error(`Failed to fetch learning resource: ${error.message}`);
    }
  }

  /**
   * Add a comment to a learning resource
   * @param userId - ID of the user commenting
   * @param resourceId - ID of the learning resource
   * @param content - Comment content
   * @returns Created comment
   */
  async addComment(userId: string, resourceId: string, content: string) {
    try {
      const resource = await this.prisma.learningResource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        throw new NotFoundError('Learning resource not found');
      }

      const comment = await this.prisma.comment.create({
        data: {
          content,
          authorId: userId,
          resourceId,
        },
        include: { author: true },
      });

      return comment;
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Rate a learning resource
   * @param userId - ID of the user rating
   * @param resourceId - ID of the learning resource
   * @param rating - Rating value (1-5)
   * @returns Updated resource with new rating
   */
  async rateResource(userId: string, resourceId: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    try {
      const resource = await this.prisma.learningResource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        throw new NotFoundError('Learning resource not found');
      }

      const existingRating = await this.prisma.rating.findFirst({
        where: { userId, resourceId },
      });

      let updatedRating;
      if (existingRating) {
        updatedRating = await this.prisma.rating.update({
          where: { id: existingRating.id },
          data: { value: rating },
        });
      } else {
        updatedRating = await this.prisma.rating.create({
          data: {
            value: rating,
            userId,
            resourceId,
          },
        });
      }

      // Recalculate average rating
      const ratings = await this.prisma.rating.findMany({
        where: { resourceId },
      });
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
          : 0;

      await this.prisma.learningResource.update({
        where: { id: resourceId },
        data: { averageRating },
      });

      return updatedRating;
    } catch (error) {
      throw new Error(`Failed to rate resource: ${error.message}`);
    }
  }

  /**
   * Update a learning resource (only by author)
   * @param userId - ID of the user updating
   * @param resourceId - ID of the resource to update
   * @param data - Updated data
   * @returns Updated resource
   */
  async updateLearningResource(
    userId: string,
    resourceId: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
      culturalContext?: string;
      language?: string;
    }
  ) {
    try {
      const resource = await this.prisma.learningResource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        throw new NotFoundError('Learning resource not found');
      }

      if (resource.authorId !== userId) {
        throw new UnauthorizedError('Only the author can update this resource');
      }

      const updatedResource = await this.prisma.learningResource.update({
        where: { id: resourceId },
        data,
      });

      return updatedResource;
    } catch (error) {
      throw new Error(`Failed to update learning resource: ${error.message}`);
    }
  }

  /**
   * Delete a learning resource (only by author)
   * @param userId - ID of the user deleting
   * @param resourceId - ID of the resource to delete
   */
  async deleteLearningResource(userId: string, resourceId: string) {
    try {
      const resource = await this.prisma.learningResource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        throw new NotFoundError('Learning resource not found');
      }

      if (resource.authorId !== userId) {
        throw new UnauthorizedError('Only the author can delete this resource');
      }

      await this.prisma.learningResource.delete({
        where: { id: resourceId },
      });

      return { message: 'Learning resource deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete learning resource: ${error.message}`);
    }
  }
}