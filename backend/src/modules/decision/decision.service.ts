import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decision, DecisionStatus } from '../../entities/decision.entity';
import { ContentSource } from '../../entities/content-base.entity';
import {
  CreateDecisionDto,
  ListDecisionQueryDto,
  UpdateDecisionDto,
} from './dto/decision.dto';

@Injectable()
export class DecisionService {
  constructor(
    @InjectRepository(Decision)
    private readonly repo: Repository<Decision>,
  ) {}

  private async getOr404(id: string, orgId: string): Promise<Decision> {
    const item = await this.repo.findOne({ where: { id, orgId } });
    if (!item) {
      throw new NotFoundException('Decision not found');
    }
    return item;
  }

  async create(dto: CreateDecisionDto, orgId: string, userId: string | null) {
    const item = this.repo.create({
      orgId,
      title: dto.title,
      description: dto.description ?? null,
      reason: dto.reason,
      outcome: dto.outcome ?? null,
      status: dto.status ?? DecisionStatus.proposed,
      source: ContentSource.manual,
      createdBy: userId,
    });
    await this.repo.save(item);
    return item.toDict();
  }

  async list(orgId: string, query: ListDecisionQueryDto) {
    const items = await this.repo.find({
      where: {
        orgId,
        ...(query.status ? { status: query.status } : {}),
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

  async update(id: string, dto: UpdateDecisionDto, orgId: string) {
    const item = await this.getOr404(id, orgId);
    for (const [field, value] of Object.entries(dto)) {
      if (value !== undefined) {
        (item as unknown as Record<string, unknown>)[field] = value;
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
