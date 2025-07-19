import { Schema, model, Document } from 'mongoose';

export interface IRitual extends Document {
  title: string;
  description: string;
  bioregionId: string;
  author: string;
  authorAddress: string;

  // Cultural Elements
  culturalReferences: string[];
  ethicalElements: string[];
  spiritualElements: string[];

  // Ritual Details
  materials: string[];
  steps: string[];
  duration: number; // in minutes
  participants: number;

  // AI Validation Scores
  esepScore: number; // 0-1.0
  cedaScore: number; // number of cultural references
  narrativeScore: number; // 0-1.0
  isApproved: boolean;

  // Storage
  ipfsHash: string;
  blockchainTxHash?: string;
  ritualId?: number; // from smart contract

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date;
  approvedAt?: Date;

  // Status
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';

  // Tags and Categories
  tags: string[];
  category: string;

  // Community
  likes: number;
  shares: number;
  views: number;

  // Moderation
  moderatedBy?: string;
  moderationNotes?: string;
  flaggedCount: number;

  // Version Control
  version: number;
  previousVersion?: string;
}

const RitualSchema = new Schema<IRitual>(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
      trim: true,
    },
    bioregionId: {
      type: String,
      required: true,
      enum: ['tech-haven', 'mythic-forest', 'isolated-bastion'],
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorAddress: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum address format',
      },
    },

    // Cultural Elements
    culturalReferences: [
      {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 200,
      },
    ],
    ethicalElements: [
      {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 200,
      },
    ],
    spiritualElements: [
      {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 200,
      },
    ],

    // Ritual Details
    materials: [
      {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 200,
      },
    ],
    steps: [
      {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 500,
      },
    ],
    duration: {
      type: Number,
      required: true,
      min: 5,
      max: 480, // 8 hours max
    },
    participants: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },

    // AI Validation Scores
    esepScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    cedaScore: {
      type: Number,
      required: true,
      min: 0,
    },
    narrativeScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },

    // Storage
    ipfsHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockchainTxHash: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^0x[a-fA-F0-9]{64}$/.test(v);
        },
        message: 'Invalid transaction hash format',
      },
    },
    ritualId: {
      type: Number,
      min: 1,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'pending', 'approved', 'rejected'],
      default: 'submitted',
    },

    // Tags and Categories
    tags: [
      {
        type: String,
        maxlength: 50,
      },
    ],
    category: {
      type: String,
      default: 'general',
      maxlength: 100,
    },

    // Community
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Moderation
    moderatedBy: {
      type: String,
    },
    moderationNotes: {
      type: String,
      maxlength: 1000,
    },
    flaggedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Version Control
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    previousVersion: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
RitualSchema.index({ bioregionId: 1, status: 1 });
RitualSchema.index({ authorAddress: 1 });
RitualSchema.index({ ipfsHash: 1 });
RitualSchema.index({ createdAt: -1 });
RitualSchema.index({ isApproved: 1, status: 1 });
RitualSchema.index({ tags: 1 });

// Virtual for approval rate
RitualSchema.virtual('approvalRate').get(function () {
  return this.esepScore * 0.4 + this.narrativeScore * 0.6;
});

// Pre-save middleware
RitualSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
RitualSchema.statics.findByBioregion = function (bioregionId: string) {
  return this.find({ bioregionId, status: 'approved' });
};

RitualSchema.statics.findByAuthor = function (authorAddress: string) {
  return this.find({ authorAddress }).sort({ createdAt: -1 });
};

RitualSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalRituals: { $sum: 1 },
        approvedRituals: {
          $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] },
        },
        averageEsepScore: { $avg: '$esepScore' },
        averageNarrativeScore: { $avg: '$narrativeScore' },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: '$likes' },
      },
    },
  ]);
};

export const Ritual = model<IRitual>('Ritual', RitualSchema);
export default Ritual;
