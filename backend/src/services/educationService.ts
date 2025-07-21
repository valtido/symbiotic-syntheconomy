// educationService.ts - Service for managing ritual education and learning platform

import { injectable, inject } from 'tsyringe';
import { Course, Module, Certification, UserProgress } from '../models';
import { DatabaseService } from './databaseService';

@injectable()
export class EducationService {
  constructor(
    @inject(DatabaseService) private dbService: DatabaseService
  ) {}

  // Course Management
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      const newCourse = await this.dbService.create('courses', courseData);
      return newCourse as Course;
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  async getCourses(culturalContext?: string): Promise<Course[]> {
    try {
      const query = culturalContext 
        ? { culturalContext } 
        : {};
      const courses = await this.dbService.find('courses', query);
      return courses as Course[];
    } catch (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  }

  // Module Management for Interactive Learning
  async addModuleToCourse(courseId: string, moduleData: Partial<Module>): Promise<Module> {
    try {
      const newModule = await this.dbService.create('modules', {
        ...moduleData,
        courseId
      });
      await this.dbService.update('courses', courseId, {
        $push: { modules: newModule._id }
      });
      return newModule as Module;
    } catch (error) {
      throw new Error(`Failed to add module: ${error.message}`);
    }
  }

  // User Progress Tracking
  async updateUserProgress(userId: string, courseId: string, progressData: Partial<UserProgress>): Promise<UserProgress> {
    try {
      const progress = await this.dbService.findOne('userProgress', { userId, courseId });
      if (progress) {
        return await this.dbService.update('userProgress', progress._id, progressData) as UserProgress;
      } else {
        return await this.dbService.create('userProgress', {
          userId,
          courseId,
          ...progressData
        }) as UserProgress;
      }
    } catch (error) {
      throw new Error(`Failed to update user progress: ${error.message}`);
    }
  }

  // Certification Programs
  async issueCertification(userId: string, courseId: string, certificationData: Partial<Certification>): Promise<Certification> {
    try {
      const progress = await this.dbService.findOne('userProgress', { userId, courseId });
      if (progress && progress.completionStatus === 'completed') {
        const certification = await this.dbService.create('certifications', {
          userId,
          courseId,
          ...certificationData,
          issueDate: new Date()
        });
        return certification as Certification;
      } else {
        throw new Error('User has not completed the course');
      }
    } catch (error) {
      throw new Error(`Failed to issue certification: ${error.message}`);
    }
  }

  async getUserCertifications(userId: string): Promise<Certification[]> {
    try {
      const certifications = await this.dbService.find('certifications', { userId });
      return certifications as Certification[];
    } catch (error) {
      throw new Error(`Failed to fetch certifications: ${error.message}`);
    }
  }

  // Cultural Competency Training
  async enrollInCulturalTraining(userId: string, trainingId: string): Promise<UserProgress> {
    try {
      return await this.updateUserProgress(userId, trainingId, {
        enrolled: true,
        enrollmentDate: new Date(),
        completionStatus: 'in-progress'
      });
    } catch (error) {
      throw new Error(`Failed to enroll in cultural training: ${error.message}`);
    }
  }

  // Community Knowledge Sharing
  async shareKnowledge(userId: string, courseId: string, content: string): Promise<any> {
    try {
      const contribution = await this.dbService.create('contributions', {
        userId,
        courseId,
        content,
        createdAt: new Date()
      });
      await this.dbService.update('courses', courseId, {
        $push: { contributions: contribution._id }
      });
      return contribution;
    } catch (error) {
      throw new Error(`Failed to share knowledge: ${error.message}`);
    }
  }

  async getCommunityContributions(courseId: string): Promise<any[]> {
    try {
      const contributions = await this.dbService.find('contributions', { courseId });
      return contributions;
    } catch (error) {
      throw new Error(`Failed to fetch contributions: ${error.message}`);
    }
  }
}
