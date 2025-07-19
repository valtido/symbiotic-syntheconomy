import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  walletAddress: string;

  // Profile Information
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;

  // Bioregion Affiliation
  primaryBioregion?: string;
  bioregionAffiliations: string[];

  // Reputation and Stats
  reputation: number;
  ritualsSubmitted: number;
  ritualsApproved: number;
  totalLikes: number;
  totalViews: number;

  // DAO Participation
  daoMember: boolean;
  votingPower: number;
  proposalsCreated: number;
  proposalsVoted: number;

  // Authentication
  isVerified: boolean;
  lastLogin: Date;
  loginCount: number;

  // Preferences
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      dao: boolean;
    };
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
      trim: true,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum address format',
      },
    },

    // Profile Information
    displayName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    avatar: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Avatar must be a valid URL',
      },
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    location: {
      type: String,
      maxlength: 100,
      trim: true,
    },

    // Bioregion Affiliation
    primaryBioregion: {
      type: String,
      enum: ['tech-haven', 'mythic-forest', 'isolated-bastion'],
    },
    bioregionAffiliations: [
      {
        type: String,
        enum: ['tech-haven', 'mythic-forest', 'isolated-bastion'],
      },
    ],

    // Reputation and Stats
    reputation: {
      type: Number,
      default: 0,
      min: 0,
    },
    ritualsSubmitted: {
      type: Number,
      default: 0,
      min: 0,
    },
    ritualsApproved: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // DAO Participation
    daoMember: {
      type: Boolean,
      default: false,
    },
    votingPower: {
      type: Number,
      default: 0,
      min: 0,
    },
    proposalsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    proposalsVoted: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Authentication
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    loginCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Preferences
    preferences: {
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
      },
      theme: {
        type: String,
        default: 'auto',
        enum: ['light', 'dark', 'auto'],
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        dao: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ primaryBioregion: 1 });
UserSchema.index({ reputation: -1 });
UserSchema.index({ daoMember: 1 });

// Virtual for approval rate
UserSchema.virtual('approvalRate').get(function () {
  return this.ritualsSubmitted > 0
    ? (this.ritualsApproved / this.ritualsSubmitted) * 100
    : 0;
});

// Virtual for total engagement
UserSchema.virtual('totalEngagement').get(function () {
  return this.totalLikes + this.totalViews;
});

// Pre-save middleware
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
UserSchema.statics.findByBioregion = function (bioregionId: string) {
  return this.find({
    $or: [
      { primaryBioregion: bioregionId },
      { bioregionAffiliations: bioregionId },
    ],
  });
};

UserSchema.statics.findTopContributors = function (limit = 10) {
  return this.find({ reputation: { $gt: 0 } })
    .sort({ reputation: -1 })
    .limit(limit);
};

UserSchema.statics.findDAOMembers = function () {
  return this.find({ daoMember: true }).sort({ votingPower: -1 });
};

// Instance methods
UserSchema.methods.updateReputation = function (points: number) {
  this.reputation = Math.max(0, this.reputation + points);
  return this.save();
};

UserSchema.methods.addBioregionAffiliation = function (bioregionId: string) {
  if (!this.bioregionAffiliations.includes(bioregionId)) {
    this.bioregionAffiliations.push(bioregionId);
  }
  return this.save();
};

UserSchema.methods.incrementRitualStats = function (isApproved: boolean) {
  this.ritualsSubmitted += 1;
  if (isApproved) {
    this.ritualsApproved += 1;
  }
  return this.save();
};

export const User = model<IUser>('User', UserSchema);
export default User;
