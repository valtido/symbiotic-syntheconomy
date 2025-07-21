// educationService.ts - Service for managing ritual education and learning platform

import { injectable, inject } from 'tsyringe';
import { Course, Certification, UserProgress } from '../models';
import { DatabaseService } from './databaseService';

@injectable()
export class EducationService {
  constructor(@inject(DatabaseService) private dbService: DatabaseService) {}

  // Course Management
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      const newCourse = await this.dbService.create('courses', courseData);
      return newCourse as Course;
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  async getCourseById(courseId: string): Promise<Course> {
    try {
      const course = await this.dbService.findById('courses', courseId);
      if (!course) throw new Error('Course not found');
      return course as Course;
    } catch (error) {
      throw new Error(`Failed to get course: ${error.message}`);
    }
  }

  async getAllCourses(): Promise<Course[]> {
    try {
      return (await this.dbService.findAll('courses')) as Course[];
    } catch (error) {
      throw new Error(`Failed to get all courses: ${error.message}`);
    }
  }

  // User Progress Tracking
  async updateUserProgress(userId: string, courseId: string, progressData: Partial<UserProgress>): Promise<UserProgress> {
    try {
      const progress = await this.dbService.upsert('userProgress', 
        { userId, courseId }, 
        { ...progressData, userId, courseId, updatedAt: new Date() }
      );
      return progress as UserProgress;
    } catch (error) {
      throw new Error(`Failed to update user progress: ${error.message}`);
    }
  }

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress> {
    try {
      const progress = await this.dbService.findOne('userProgress', { userId, courseId });
      if (!progress) throw new Error('Progress not found');
      return progress as UserProgress;
    } catch (error) {
      throw new Error(`Failed to get user progress: ${error.message}`);
    }
  }

  // Certification Management
  async issueCertification(userId: string, courseId: string, certificationData: Partial<Certification>): Promise<Certification> {
    try {
      const certification = await this.dbService.create('certifications', {
        ...certificationData,
        userId,
        courseId,
        issuedAt: new Date(),
        status: 'active'
      });
      return certification as Certification;
    } catch (error) {
      throw new Error(`Failed to issue certification: ${error.message}`);
    }
  }

  async getUserCertifications(userId: string): Promise<Certification[]> {
    try {
      return (await this.dbService.findAll('certifications', { userId })) as Certification[];
    } catch (error) {
      throw new Error(`Failed to get user certifications: ${error.message}`);
    }
  }

  // Cultural Competency Training
  async enrollInCulturalTraining(userId: string, trainingId: string): Promise<any> {
    try {
      return await this.dbService.upsert('culturalTrainingEnrollments', 
        { userId, trainingId }, 
        { userId, trainingId, enrolledAt: new Date(), status: 'enrolled' }
      );
    } catch (error) {
      throw new Error(`Failed to enroll in cultural training: ${error.message}`);
    }
  }

  async getCulturalTrainings(userId: string): Promise<any[]> {
    try {
      return await this.dbService.findAll('culturalTrainingEnrollments', { userId });
    } catch (error) {
      throw new Error(`Failed to get cultural trainings: ${error.message}`);
    }
  }
}
