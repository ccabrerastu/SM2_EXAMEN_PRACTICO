import { Injectable, Logger } from '@nestjs/common';
import { ReadingChapterRepository } from '../../../infrastructure/repositories/reading-chapter.repository';
import { ReadingChapterStatusDto } from '../../dtos/reading/reading-chapter-status-response.dto';

@Injectable()
export class GetReadingChaptersStatusUseCase {
  private readonly logger = new Logger(GetReadingChaptersStatusUseCase.name);

  constructor(private readonly readingChapterRepository: ReadingChapterRepository) {}

  async execute(userId: string): Promise<{
    chapters: ReadingChapterStatusDto[];
    totalChapters: number;
    unlockedChapters: number;
    completedChapters: number;
  }> {
    this.logger.log(`Getting reading chapters status for user: ${userId}`);

    const { chapters: chaptersWithProgress } =
      await this.readingChapterRepository.getUserChapterStatus(userId);

    const chapters: ReadingChapterStatusDto[] = chaptersWithProgress.map(item => ({
      id: item.chapter.id,
      title: item.chapter.title,
      description: item.chapter.description,
      level: item.chapter.level,
      order: item.chapter.order,
      imageUrl: item.chapter.imageUrl,
      topic: item.chapter.topic,
      isUnlocked: item.isUnlocked,
      isCompleted: item.userProgress?.chapterCompleted || false,
      progressPercentage: item.progressPercentage,
      estimatedReadingTime: (item.chapter.metadata?.estimatedMinutes as number) || null,
      lastActivity: item.userProgress?.lastActivity || null,
      completionDate: item.userProgress?.chapterCompletionDate || null,
    }));

    return {
      chapters,
      totalChapters: chapters.length,
      unlockedChapters: chapters.filter(c => c.isUnlocked).length,
      completedChapters: chapters.filter(c => c.isCompleted).length,
    };
  }
}
