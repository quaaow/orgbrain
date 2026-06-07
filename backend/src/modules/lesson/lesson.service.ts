import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../../entities/lesson.entity';
import { ContentSource } from '../../entities/content-base.entity';
import {
  CreateLessonDto,
  ListLessonQueryDto,
  UpdateLessonDto,
} from './dto/lesson.dto';

@Injectable()
export class LessonService {
  constructor(
    @InjectRepository(Lesson)
    private readonly repo: Repository<Lesson>,
  ) {}

  private async getOr404(id: string, orgId: string): Promise<Lesson> {
    const item = await this.repo.findOne({ where: { id, orgId } });
    if (!item) {
      throw new NotFoundException('Lesson not found');
    }
    return item;
  }

  async create(dto: CreateLessonDto, orgId: string, userId: string | null) {
    const item = this.repo.create({
      orgId,
      problem: dto.problem,
      solution: dto.solution,
      result: dto.result ?? null,
      confidence: dto.confidence ?? 0.5,
      decisionId: dto.decision_id ?? null,
      source: ContentSource.manual,
      createdBy: userId,
    });
    await this.repo.save(item);
    return item.toDict();
  }

  async list(orgId: string, query: ListLessonQueryDto) {
    const items = await this.repo.find({
      where: {
        orgId,
        ...(query.decision_id ? { decisionId: query.decision_id } : {}),
      },
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });
    return items.map((i) => i.toDict());
  }

  async get(id: string, orgId: string) {
    const item = await this.getOr404(id, orgId);
    return item.toDict();
  }

  async update(id: string, dto: UpdateLessonDto, orgId: string) {
    const item = await this.getOr404(id, orgId);
    const map: Record<string, string> = { decision_id: 'decisionId' };
    for (const [field, value] of Object.entries(dto)) {
      if (value !== undefined) {
        (item as unknown as Record<string, unknown>)[map[field] ?? field] = value;
      }
    }
    await this.repo.save(item);
    return item.toDict();
  }

  async remove(id: string, orgId: string): Promise<void> {
    const item = await this.getOr404(id, orgId);
    await this.repo.remove(item);
  }
}
