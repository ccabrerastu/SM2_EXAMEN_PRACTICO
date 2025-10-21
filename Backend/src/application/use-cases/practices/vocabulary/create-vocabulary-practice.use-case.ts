import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PracticeSession,
  PracticeType,
  PracticeStatus,
} from '../../../../domain/entities/practice-session.entity';
import { VocabularyPractice } from '../../../../domain/entities/vocabulary-practice.entity';
import { IPracticeSessionRepository } from '../../../interfaces/repositories/practice-session-repository.interface';
import { IVocabularyPracticeRepository } from '../../../interfaces/repositories/vocabulary-practice-repository.interface';
import { IChapterRepository } from '../../../interfaces/repositories/chapter-repository.interface';
import { CreateVocabularyPracticeDto } from '../../../dtos/vocabulary-practice.dto';

@Injectable()
export class CreateVocabularyPracticeUseCase {
  constructor(
    private readonly practiceSessionRepository: IPracticeSessionRepository,
    private readonly vocabularyPracticeRepository: IVocabularyPracticeRepository,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async execute(
    userId: string,
    createDto: CreateVocabularyPracticeDto,
  ): Promise<VocabularyPractice> {
    let chapter = null;

    // Validate chapter exists if chapterId is provided
    if (createDto.chapterId) {
      chapter = await this.chapterRepository.findById(createDto.chapterId);
      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }
    }

    // Create practice session
    const practiceSession = new PracticeSession();
    practiceSession.userId = userId;
    if (createDto.chapterId) {
      practiceSession.chapterId = createDto.chapterId;
    }
    practiceSession.practiceType = PracticeType.VOCABULARY;
    practiceSession.status = PracticeStatus.STARTED;
    practiceSession.progress = 0;
    practiceSession.score = 0;
    practiceSession.maxScore = 100; // Vocabulary practice is percentage-based
    practiceSession.timeSpentSeconds = 0;
    if (chapter) {
      practiceSession.chapter = chapter;
    }

    const savedSession = await this.practiceSessionRepository.create(practiceSession);

    // Create vocabulary practice
    const vocabularyPractice = VocabularyPractice.createForSession(
      savedSession,
      createDto.difficultyLevel,
    );

    const savedVocabularyPractice =
      await this.vocabularyPracticeRepository.create(vocabularyPractice);

    // Update session status to in progress
    await this.practiceSessionRepository.update(savedSession.id, {
      status: PracticeStatus.IN_PROGRESS,
    });

    return savedVocabularyPractice;
  }
}
