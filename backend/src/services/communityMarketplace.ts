// Advanced Community Marketplace and Economy for Ritual Goods and Services

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerId: string;
  category: string;
  type: 'GOOD' | 'SERVICE';
  status: 'ACTIVE' | 'SOLD' | 'PENDING';
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

class CommunityMarketplace {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create a new listing for ritual goods or services
  async createListing(
    title: string,
    description: string,
    price: number,
    sellerId: string,
    category: string,
    type: 'GOOD' | 'SERVICE'
  ): Promise<Listing> {
    try {
      const listing = await this.prisma.listing.create({
        data: {
          title,
          description,
          price,
          sellerId,
          category,
          type,
          status: 'ACTIVE',
        },
      });
      logger.info(`New listing created: ${title} by user ${sellerId}`);
      return listing;
    } catch (error) {
      logger.error(`Error creating listing: ${error.message}`);
      throw new Error(`Failed to create listing: ${error.message}`);
    }
  }

  // Get all active listings with optional filters
  async getListings(
    category?: string,
    type?: 'GOOD' | 'SERVICE',
    minPrice?: number,
    maxPrice?: number
  ): Promise<Listing[]> {
    try {
      const filters: any = { status: 'ACTIVE' };
      if (category) filters.category = category;
      if (type) filters.type = type;
      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.gte = minPrice;
        if (maxPrice) filters.price.lte = maxPrice;
      }

      const listings = await this.prisma.listing.findMany({ where: filters });
      return listings;
    } catch (error) {
      logger.error(`Error fetching listings: ${error.message}`);
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }
  }

  // Initiate a transaction for a listing
  async initiateTransaction(listingId: string, buyerId: string): Promise<Transaction> {
    try {
      const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing || listing.status !== 'ACTIVE') {
        throw new Error('Listing not available');
      }

      await this.prisma.listing.update({
        where: { id: listingId },
        data: { status: 'PENDING' },
      });

      const transaction = await this.prisma.transaction.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          amount: listing.price,
          status: 'PENDING',
        },
      });

      logger.info(`Transaction initiated for listing ${listingId} by buyer ${buyerId}`);
      return transaction;
    } catch (error) {
      logger.error(`Error initiating transaction: ${error.message}`);
      throw new Error(`Failed to initiate transaction: ${error.message}`);
    }
  }

  // Complete a transaction
  async completeTransaction(transactionId: string): Promise<Transaction> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
      });
      if (!transaction || transaction.status !== 'PENDING') {
        throw new Error('Invalid transaction status');
      }

      await this.prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: 'SOLD' },
      });

      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' },
      });

      logger.info(`Transaction completed: ${transactionId}`);
      return updatedTransaction;
    } catch (error) {
      logger.error(`Error completing transaction: ${error.message}`);
      throw new Error(`Failed to complete transaction: ${error.message}`);
    }
  }

  // Get user's transaction history
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      return transactions;
    } catch (error) {
      logger.error(`Error fetching user transactions: ${error.message}`);
      throw new Error(`Failed to fetch user transactions: ${error.message}`);
    }
  }

  // Calculate marketplace statistics
  async getMarketplaceStats(): Promise<{
    totalListings: number;
    activeListings: number;
    totalTransactions: number;
    totalVolume: number;
  }> {
    try {
      const totalListings = await this.prisma.listing.count();
      const activeListings = await this.prisma.listing.count({
        where: { status: 'ACTIVE' },
      });
      const totalTransactions = await this.prisma.transaction.count();
      const transactions = await this.prisma.transaction.findMany({
        where: { status: 'COMPLETED' },
      });
      const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);

      return { totalListings, activeListings, totalTransactions, totalVolume };
    } catch (error) {
      logger.error(`Error calculating marketplace stats: ${error.message}`);
      throw new Error(`Failed to calculate marketplace stats: ${error.message}`);
    }
  }
}

export default CommunityMarketplace;
