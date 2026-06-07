import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

export interface AuditEntry {
  organizationId: string | null;
  userId: string | null;
  method: string;
  path: string;
  statusCode: number;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /** Persist an audit entry. Failures are swallowed — auditing must never
   * break the request it is recording. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      const log = this.repo.create({
        organizationId: entry.organizationId,
        userId: entry.userId,
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        metadata: entry.metadata ?? null,
      });
      await this.repo.save(log);
    } catch (error) {
      this.logger.warn(`Failed to write audit log: ${(error as Error).message}`);
    }
  }
}
