// Advanced Ritual Education and Certification Platform Service
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Course } from '../schemas/course.schema';
import { Certification } from '../schemas/certification.schema';
import { BlockchainService } from './blockchain.service';
import { GamificationService } from './gamification.service';
import { AdaptiveLearningService } from './adaptiveLearning.service';

@Injectable()
export class AdvancedEducationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Certification.name) private certificationModel: Model<Certification>,
    private blockchainService: BlockchainService,
    private gamificationService: GamificationService,
    private adaptiveLearningService: AdaptiveLearningService,
  ) {}

  // Enroll user in a course with adaptive learning path
  async enrollUserInCourse(userId: string, courseId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    const course = await this.courseModel.findById(courseId);

    if (!user || !course) {
      throw new Error('User or Course not found');
    }

    user.enrolledCourses.push(courseId);
    await user.save();

    // Initialize adaptive learning path for the user
    const learningPath = await this.adaptiveLearningService.createLearningPath(userId, courseId);

    // Award initial gamification badge for enrollment
    await this.gamificationService.awardBadge(userId, 'Course Enrollment');

    return { user, learningPath };
  }

  // Complete a course module and update progress
  async completeModule(userId: string, courseId: string, moduleId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    const course = await this.courseModel.findById(courseId);

    if (!user || !course) {
      throw new Error('User or Course not found');
    }

    // Update user progress
    const progress = user.courseProgress.find(p => p.courseId === courseId);
    if (progress) {
      progress.completedModules.push(moduleId);
    } else {
      user.courseProgress.push({ courseId, completedModules: [moduleId] });
    }

    await user.save();

    // Award points for module completion
    await this.gamificationService.awardPoints(userId, 10);

    // Check if course is completed
    const totalModules = course.modules.length;
    const completedModules = progress?.completedModules.length || 1;
    if (completedModules === totalModules) {
      return this.issueMicroCredential(userId, courseId);
    }

    return { progress: completedModules, total: totalModules };
  }

  // Issue blockchain-based micro-credential
  async issueMicroCredential(userId: string, courseId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    const course = await this.courseModel.findById(courseId);

    if (!user || !course) {
      throw new Error('User or Course not found');
    }

    // Create certification record
    const certification = new this.certificationModel({
      userId,
      courseId,
      issuedAt: new Date(),
      type: 'Micro-Credential',
    });

    await certification.save();

    // Record certification on blockchain
    const blockchainRecord = await this.blockchainService.issueCertificate(
      userId,
      course.title,
      certification._id.toString()
    );

    certification.blockchainHash = blockchainRecord.hash;
    await certification.save();

    // Award gamification badge for certification
    await this.gamificationService.awardBadge(userId, 'Micro-Credential Earned');

    return { certification, blockchainRecord };
  }

  // Peer-to-peer education session creation
  async createPeerSession(mentorId: string, menteeId: string, topic: string): Promise<any> {
    const mentor = await this.userModel.findById(mentorId);
    const mentee = await this.userModel.findById(menteeId);

    if (!mentor || !mentee) {
      throw new Error('Mentor or Mentee not found');
    }

    const session = {
      mentorId,
      menteeId,
      topic,
      createdAt: new Date(),
      status: 'Scheduled',
    };

    mentor.peerSessions.push(session);
    mentee.peerSessions.push(session);

    await mentor.save();
    await mentee.save();

    // Award points for peer engagement
    await this.gamificationService.awardPoints(mentorId, 5);
    await this.gamificationService.awardPoints(menteeId, 5);

    return session;
  }

  // Cultural heritage training module completion
  async completeCulturalTraining(userId: string, trainingId: string): Promise<any> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.completedCulturalTrainings.push(trainingId);
    await user.save();

    // Award badge for cultural competency
    await this.gamificationService.awardBadge(userId, 'Cultural Competency');

    return { trainingId, status: 'Completed' };
  }

  // Get user's learning dashboard with gamification stats
  async getLearningDashboard(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).populate('enrolledCourses');

    if (!user) {
      throw new Error('User not found');
    }

    const gamificationStats = await this.gamificationService.getUserStats(userId);
    const adaptivePath = await this.adaptiveLearningService.getCurrentPath(userId);

    return {
      enrolledCourses: user.enrolledCourses,
      courseProgress: user.courseProgress,
      certifications: await this.certificationModel.find({ userId }),
      culturalTrainings: user.completedCulturalTrainings,
      gamification: gamificationStats,
      adaptiveLearningPath: adaptivePath,
    };
  }
}
