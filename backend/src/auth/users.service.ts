import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /**
   * Idempotently provision a local user row from Supabase token claims.
   * Called on every authenticated request so memberships can reference and
   * member listings can resolve emails without depending on Supabase reads.
   */
  async ensureUser(
    id: string,
    email: string | null,
    name: string | null,
  ): Promise<void> {
    await this.repo.upsert(
      { id, email: email ?? `${id}@unknown.local`, name: name ?? null },
      { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true },
    );
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }
}
